/**
 * DNA AUTO — Motor de Rastreamento em Primeiro Plano, Detecção Probabilística de Viagens
 * e Fila de Sincronização Local (Respeitando limitações de bateria e privacidade LGPD)
 */

const DnaTrackingEngine = {
    isTracking: false,
    watchId: null,
    _nativeStarting: false,
    _promptedOdometerThisSession: false,
    lastError: null,
    currentTrip: null,
    lastPosition: null,
    stationaryTimer: null,
    vibrationSamples: [],
    
    // Configurações
    config: {
        minAccuracyMeters: 30, // Descarte de amostras imprecisas
        maxRealisticSpeedKmh: 160, // Descarte de saltos de GPS
        stationaryTimeoutMs: 180000, // 3 minutos parado encerra a viagem
        minTripDistanceKm: 0.15 // 150m mínimo para considerar deslocamento
    },

    // Inicializa o motor
    init(licensePlate) {
        if (!licensePlate || licensePlate === '---') return;
        this.licensePlate = licensePlate;
        this.loadPreferences();
        if (!this._listenersBound) {
            window.addEventListener('online', () => { this.syncNativeTrips(); this.syncQueuedTrips(); });
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) this.syncNativeTrips();
            });
            this._listenersBound = true;
        }
        this.syncNativeTrips();
        if (this.preferences.isEnabled && this.preferences.consentGiven) this.startTracking();
    },

    // Preferências e Consentimento LGPD
    loadPreferences() {
        try {
            const raw = localStorage.getItem('dna_tracking_preferences');
            this.preferences = raw ? JSON.parse(raw) : {
                isEnabled: false,
                consentGiven: false,
                consentDate: null,
                pairedBluetoothName: localStorage.getItem('dna_obd_device_name') || null
            };
        } catch (_) {
            this.preferences = { isEnabled: false, consentGiven: false };
        }
    },

    async savePreferences(prefs) {
        this.preferences = Object.assign(this.preferences || {}, prefs);
        if (this.preferences.isEnabled) {
            this.preferences.consentGiven = true;
            this.preferences.consentDate = this.preferences.consentDate || new Date().toISOString();
        }
        localStorage.setItem('dna_tracking_preferences', JSON.stringify(this.preferences));
        if (this.preferences.isEnabled) {
            const started = await this.startTracking();
            if (started === false) {
                this.preferences.isEnabled = false;
                localStorage.setItem('dna_tracking_preferences', JSON.stringify(this.preferences));
                return false;
            }
        } else {
            await this.stopTracking();
        }
        return true;
    },

    // O monitoramento nativo continua com a tela apagada; web/PWA só rastreia em 1º plano.
    nativePlugin() {
        const cap = window.Capacitor;
        if (!cap || !(cap.isNativePlatform?.() || cap.platform === 'android')) return null;
        if (cap.isPluginAvailable && !cap.isPluginAvailable('DnaMileage')) return null;
        return cap.Plugins?.DnaMileage || (typeof cap.registerPlugin === 'function' ? cap.registerPlugin('DnaMileage') : null);
    },

    async startNativeTracking() {
        const native = this.nativePlugin();
        if (!native || this._nativeStarting) return this.isTracking;
        const plate = String(this.licensePlate || '').trim();
        if (!plate) return false;
        this._nativeStarting = true;
        this.lastError = null;
        try {
            // Sincronize dados nativos antigos antes de trocar veículo/base do hodômetro.
            const state = await native.getState();
            if (state?.plate && state.plate !== plate && state.trips?.length) {
                await this.syncNativeTrips();
                const pending = await native.getState();
                if (pending.trips?.length) throw new Error('Sincronize as viagens do veículo anterior antes de trocar de carro.');
            }
            const owner = window.OwnerView || {};
            const officialKm = Number(owner.odometerData?.official_odometer_km || owner.vehicleData?.current_mileage || 0);
            const confirmedAt = String(owner.odometerData?.odometer?.official_date || 'cadastro-inicial') + '|' + officialKm;
            const targets = (owner.predictiveData?.predictions || [])
                .map(x => Number(x.next_due_km))
                .filter(n => Number.isFinite(n) && n > 0);
            const targetKm = targets.length ? Math.min(...targets) : 0;
            await native.configure({
                enabled: true, plate, officialKm, targetKm, confirmedAt
            });
            this.isTracking = true;
            await this.syncNativeTrips();
            await this.promptOdometerIfNeeded();
            return true;
        } catch (e) {
            this.isTracking = false;
            this.lastError = e?.message || 'Não foi possível ativar o monitoramento do Android.';
            console.warn('[DNA AUTO] Serviço de localização nativo:', this.lastError);
            return false;
        } finally {
            this._nativeStarting = false;
        }
    },

    async syncNativeTrips() {
        const native = this.nativePlugin();
        if (!native || this._syncingNative) return false;
        this._syncingNative = true;
        try {
            const state = await native.getState();
            const trips = Array.isArray(state?.trips) ? state.trips : [];
            if (!trips.length || !state.plate) return true;
            const res = await fetch(`/api/v1/vehicles/${encodeURIComponent(state.plate)}/monitoring/sync-trips`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...((localStorage.getItem('dna_token') || localStorage.getItem('dna_auto_token')) ?
                        { Authorization: 'Bearer ' + (localStorage.getItem('dna_token') || localStorage.getItem('dna_auto_token')) } : {})
                },
                body: JSON.stringify({ trips })
            });
            if (!res.ok) throw new Error('Falha HTTP ' + res.status);
            const result = await res.json();
            if (!result.success) throw new Error(result.error || 'Sincronização não confirmada.');
            await native.acknowledgeTrips({ ids: trips.map(t => t.id).filter(Boolean) });
            return true;
        } catch (e) {
            console.warn('[DNA AUTO] As viagens continuarão guardadas no Android para sincronização:', e.message);
            return false;
        } finally {
            this._syncingNative = false;
        }
    },

    async promptOdometerIfNeeded() {
        const native = this.nativePlugin();
        if (!native || this._promptedOdometerThisSession) return;
        try {
            const state = await native.getState();
            if (state?.confirmRequired && window.OwnerView) {
                this._promptedOdometerThisSession = true;
                setTimeout(() => {
                    const owner = window.OwnerView;
                    if (!owner?.authScreen && typeof owner.openOdometerModal === 'function') {
                        owner.openOdometerModal();
                    } else {
                        this._promptedOdometerThisSession = false;
                    }
                }, 450);
            }
        } catch (_) {}
    },

    async odometerConfirmed() {
        this._promptedOdometerThisSession = false;
        const native = this.nativePlugin();
        if (native) await native.acknowledgeOdometer().catch(() => null);
        // fetchVehicleExtras depois da gravação atualizará a base oficial e os limites.
    },

    // Iniciar monitoramento
    startTracking() {
        if (this.nativePlugin()) return this.startNativeTracking();
        if (this.isTracking) return true;
        if (!navigator.geolocation) {
            console.warn('[DNA AUTO] Geolocalização não suportada neste navegador.');
            return;
        }

        this.isTracking = true;

        // Iniciar captura de movimento do acelerômetro se suportado
        this.startMotionCapture();

        try {
            this.watchId = navigator.geolocation.watchPosition(
                (pos) => this.handlePosition(pos),
                (err) => this.handlePositionError(err),
                {
                    enableHighAccuracy: true,
                    timeout: 12000,
                    maximumAge: 4000
                }
            );
            console.log('[DNA AUTO] Monitoramento inteligente de deslocamento ativo.');
        } catch (e) {
            console.warn('[DNA AUTO] Erro ao iniciar GPS:', e);
            this.isTracking = false;
            return false;
        }
        return true;
    },

    // Parar monitoramento
    async stopTracking() {
        const native = this.nativePlugin();
        if (native) {
            try {
                const state = await native.getState();
                await native.configure({
                    enabled: false,
                    plate: state.plate || this.licensePlate || '',
                    officialKm: Number(state.officialKm || 0),
                    targetKm: 0,
                    confirmedAt: ''
                });
            } catch (e) { console.warn('[DNA AUTO] Parada do GPS nativo:', e); }
        }
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        this.stopMotionCapture();
        if (this.currentTrip) {
            this.finalizeCurrentTrip();
        }
        this.isTracking = false;
        console.log('[DNA AUTO] Monitoramento pausado pelo usuário.');
    },

    // Captura de sensores inerciais (Acelerômetro)
    startMotionCapture() {
        this._motionHandler = (event) => {
            const acc = event.accelerationIncludingGravity || event.acceleration;
            if (!acc) return;
            const magnitude = Math.sqrt((acc.x || 0)**2 + (acc.y || 0)**2 + (acc.z || 0)**2);
            this.vibrationSamples.push(magnitude);
            if (this.vibrationSamples.length > 50) this.vibrationSamples.shift();
        };

        if (window.DeviceMotionEvent) {
            try {
                window.addEventListener('devicemotion', this._motionHandler, { passive: true });
            } catch (_) {}
        }
    },

    stopMotionCapture() {
        if (this._motionHandler && window.removeEventListener) {
            window.removeEventListener('devicemotion', this._motionHandler);
        }
        this.vibrationSamples = [];
    },

    // Processamento de pontos de GPS
    handlePosition(position) {
        const { latitude, longitude, accuracy, speed } = position.coords;
        const timestamp = position.timestamp || Date.now();

        // 1. Filtro de Precisão (descarta se accuracy > 30m)
        if (accuracy > this.config.minAccuracyMeters) {
            return;
        }

        const currentPoint = { lat: latitude, lng: longitude, accuracy, timestamp };

        if (!this.lastPosition) {
            this.lastPosition = currentPoint;
            return;
        }

        // 2. Calcular distância e velocidade entre os pontos
        const distanceMeters = this.calculateHaversineDistance(
            this.lastPosition.lat, this.lastPosition.lng,
            currentPoint.lat, currentPoint.lng
        );
        const timeDiffSeconds = Math.max(1, (currentPoint.timestamp - this.lastPosition.timestamp) / 1000);
        const calculatedSpeedKmh = (distanceMeters / timeDiffSeconds) * 3.6;

        // 3. Descarte de Saltos e Anomalias Físicas
        if (calculatedSpeedKmh > this.config.maxRealisticSpeedKmh) {
            return;
        }

        const pointSpeed = (speed !== null && speed >= 0) ? (speed * 3.6) : calculatedSpeedKmh;

        // 4. Lógica de Início / Continuidade de Viagem
        if (!this.currentTrip) {
            // Se velocidade acima de 10 km/h, inicia detecção de viagem
            if (pointSpeed > 10) {
                this.currentTrip = {
                    id: `trip_loc_${Date.now()}`,
                    startTime: new Date().toISOString(),
                    points: [this.lastPosition, currentPoint],
                    distanceKm: distanceMeters / 1000,
                    speeds: [pointSpeed],
                    highAccuracyCount: 1,
                    vibrationProfile: this.analyzeVibration()
                };
            }
        } else {
            // Continuidade da viagem em andamento
            this.currentTrip.distanceKm += distanceMeters / 1000;
            this.currentTrip.points.push(currentPoint);
            this.currentTrip.speeds.push(pointSpeed);
            if (accuracy <= 20) this.currentTrip.highAccuracyCount++;

            // Detecção de Parada / Encerramento
            if (pointSpeed < 3.0) {
                if (!this.stationaryTimer) {
                    this.stationaryTimer = setTimeout(() => {
                        this.finalizeCurrentTrip();
                    }, this.config.stationaryTimeoutMs);
                }
            } else {
                if (this.stationaryTimer) {
                    clearTimeout(this.stationaryTimer);
                    this.stationaryTimer = null;
                }
            }
        }

        this.lastPosition = currentPoint;
    },

    handlePositionError(err) {
        console.warn('[DNA AUTO] Aviso de geolocalização:', err.message);
    },

    // Finalizar viagem e colocar na fila de sincronização
    finalizeCurrentTrip() {
        if (!this.currentTrip) return;
        if (this.stationaryTimer) {
            clearTimeout(this.stationaryTimer);
            this.stationaryTimer = null;
        }

        const trip = this.currentTrip;
        this.currentTrip = null;

        const durationSeconds = Math.round((Date.now() - new Date(trip.startTime).getTime()) / 1000);
        if (trip.distanceKm < this.config.minTripDistanceKm || durationSeconds < 60) {
            // Viagem desprezível / ruído estacionário
            return;
        }

        const sumSpeed = trip.speeds.reduce((a, b) => a + b, 0);
        const avgSpeed = trip.speeds.length > 0 ? (sumSpeed / trip.speeds.length) : 0;
        const maxSpeed = trip.speeds.length > 0 ? Math.max(...trip.speeds) : 0;

        const isBluetoothConnected = !!(
            localStorage.getItem('dna_obd_paired') === 'true' ||
            (this.preferences && this.preferences.pairedBluetoothName)
        );

        const tripPayload = {
            id: trip.id,
            start_time: trip.startTime,
            end_time: new Date().toISOString(),
            duration_seconds: durationSeconds,
            distance_km: Number(trip.distanceKm.toFixed(2)),
            avg_speed_kmh: Number(avgSpeed.toFixed(1)),
            max_speed_kmh: Number(maxSpeed.toFixed(1)),
            bluetooth_connected: isBluetoothConnected,
            accelerometer_profile: trip.vibrationProfile,
            samples_count: trip.points.length,
            samples_high_accuracy: trip.highAccuracyCount
        };

        this.enqueueTrip(tripPayload);
        this.syncQueuedTrips();
    },

    // Fila local no localStorage (Resistente a falta de internet)
    enqueueTrip(trip) {
        try {
            const queue = this.getQueuedTrips();
            queue.push(trip);
            localStorage.setItem('dna_queued_trips', JSON.stringify(queue));
            console.log(`[DNA AUTO] Viagem de ${trip.distance_km} km adicionada à fila local de sincronização.`);
        } catch (_) {}
    },

    getQueuedTrips() {
        try {
            const raw = localStorage.getItem('dna_queued_trips');
            return raw ? JSON.parse(raw) : [];
        } catch (_) { return []; }
    },

    clearQueuedTrips() {
        localStorage.removeItem('dna_queued_trips');
    },

    // Sincronizar viagens da fila com o servidor
    async syncQueuedTrips() {
        const queue = this.getQueuedTrips();
        if (queue.length === 0) return;

        const plate = this.licensePlate || (window.OwnerView && window.OwnerView.vehicleData && window.OwnerView.vehicleData.license_plate);
        if (!plate) return;

        try {
            const res = await fetch(`/api/v1/vehicles/${plate}/monitoring/sync-trips`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trips: queue })
            });

            if (res.ok) {
                const data = await res.json();
                this.clearQueuedTrips();
                console.log(`[DNA AUTO] Sincronização concluída: ${data.message} (+${data.accepted_km} km confirmados).`);
                
                // Atualizar dados na interface
                if (window.OwnerView && typeof window.OwnerView.fetchVehicleExtras === 'function') {
                    window.OwnerView.fetchVehicleExtras(plate).then(() => window.OwnerView.render());
                }
            }
        } catch (err) {
            console.warn('[DNA AUTO] Falha ao sincronizar viagens (sem conexão). Aguardando rede:', err.message);
        }
    },

    // Análise rápida do acelerômetro
    analyzeVibration() {
        if (!this.vibrationSamples || this.vibrationSamples.length < 5) return 'UNKNOWN';
        const variance = this.calculateVariance(this.vibrationSamples);
        // Vibração automotiva tem variância moderada contínua, enquanto passos humanos têm picos rítmicos altos
        if (variance > 4.5) return 'WALKING_STEPS';
        if (variance >= 0.8 && variance <= 4.5) return 'VEHICLE_VIBRATION';
        return 'STATIONARY';
    },

    calculateVariance(arr) {
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        return arr.reduce((sum, val) => sum + (val - mean) ** 2, 0) / arr.length;
    },

    // Fórmula de Haversine para cálculo de distância métrica precisa
    calculateHaversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Raio da Terra em metros
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    // ── SIMULADOR DE TESTES EM BANCADA PARA VALIDAÇÃO CONTROLADA ──
    async simulateTrip(scenario) {
        const plate = this.licensePlate || (window.OwnerView && window.OwnerView.vehicleData && window.OwnerView.vehicleData.license_plate) || 'BRA2E19';
        let tripData;

        if (scenario === 'city') {
            tripData = {
                id: `sim_city_${Date.now()}`,
                duration_seconds: 780, // 13 minutos
                distance_km: 6.8,
                avg_speed_kmh: 31.4,
                max_speed_kmh: 58.0,
                bluetooth_connected: true,
                accelerometer_profile: 'VEHICLE_VIBRATION',
                samples_count: 35,
                samples_high_accuracy: 32
            };
        } else if (scenario === 'highway') {
            tripData = {
                id: `sim_hwy_${Date.now()}`,
                duration_seconds: 2400, // 40 minutos
                distance_km: 52.4,
                avg_speed_kmh: 88.5,
                max_speed_kmh: 114.0,
                bluetooth_connected: true,
                accelerometer_profile: 'VEHICLE_VIBRATION',
                samples_count: 85,
                samples_high_accuracy: 80
            };
        } else if (scenario === 'walking') {
            tripData = {
                id: `sim_walk_${Date.now()}`,
                duration_seconds: 600, // 10 minutos
                distance_km: 0.85,
                avg_speed_kmh: 5.1,
                max_speed_kmh: 6.8,
                bluetooth_connected: false,
                accelerometer_profile: 'WALKING_STEPS',
                samples_count: 20,
                samples_high_accuracy: 18
            };
        } else {
            tripData = {
                id: `sim_bus_${Date.now()}`,
                duration_seconds: 900,
                distance_km: 5.2,
                avg_speed_kmh: 22.0,
                max_speed_kmh: 48.0,
                bluetooth_connected: false,
                accelerometer_profile: 'UNKNOWN',
                samples_count: 30,
                samples_high_accuracy: 25
            };
        }

        this.enqueueTrip(tripData);
        await this.syncQueuedTrips();
        return tripData;
    }
};

window.DnaTrackingEngine = DnaTrackingEngine;
