/**
 * DNA AUTO — Motor de Rastreamento em Primeiro Plano, Detecção Probabilística de Viagens
 * e Fila de Sincronização Local (Respeitando limitações de bateria e privacidade LGPD)
 */

const DnaTrackingEngine = {
    isTracking: false,
    watchId: null,
    _nativeStarting: false,
    _promptedOdometerThisSession: false,
    _urgentAlertShown: null,
    _urgentRetryScheduled: false,
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
                if (!document.hidden) { this.syncNativeTrips(); this.promptOdometerIfNeeded(); }
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

    async requestTrackingPermissions() {
        const native = this.nativePlugin();
        if (native) {
            try {
                await native.requestTrackingPermissions();
            } catch (error) {
                if (error?.code !== 'UNIMPLEMENTED') throw error;
                // APKs anteriores ainda usam as permissões concedidas nas configurações.
            }
            return;
        }
        if (!navigator.geolocation) throw new Error('GPS indisponível neste navegador.');
        const permission = await navigator.permissions?.query({ name: 'geolocation' }).catch(() => null);
        if (permission?.state === 'granted') return;
        await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(
            resolve,
            error => reject(new Error(error.code === 1
                ? 'Autorize a localização para o DNA AUTO nas permissões do navegador.'
                : 'Não foi possível obter a localização. Confira se o GPS está ligado.')),
            { timeout: 15000, maximumAge: 60000 }
        ));
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
            const nextMaintenance = (owner.predictiveData?.predictions || [])
                .filter(x => x.alert_status !== "DADOS_INSUFICIENTES" && Number.isFinite(Number(x.next_due_km)) && Number(x.next_due_km) > 0)
                .sort((a, b) => Number(a.next_due_km) - Number(b.next_due_km))[0];
            const targetKm = Number(nextMaintenance?.next_due_km || 0);
            const targetName = String(nextMaintenance?.item_name || "manutenção programada").trim().slice(0, 100);
            await native.configure({
                enabled: true, plate, officialKm, targetKm, targetName, confirmedAt
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


    // Tela de destaque somente quando o cliente volta ao aplicativo, nunca por cima de outros apps.
    showUrgentMaintenance(state) {
        if (!state || state.moving || document.hidden || !document.body || !window.OwnerView || window.OwnerView.authScreen) return false;
        if (document.getElementById('dna-critical-maintenance-overlay')) return true;
        const overlay = document.createElement('div');
        overlay.id = 'dna-critical-maintenance-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Alerta de manutenção preventiva');
        overlay.innerHTML = [
            '<style>',
            '#dna-critical-maintenance-overlay{position:fixed;inset:0;z-index:2147483000;background:rgba(9,16,30,.91);display:flex;align-items:center;justify-content:center;padding:22px;box-sizing:border-box;font-family:system-ui,sans-serif;}',
            '#dna-critical-maintenance-overlay .dna-critical-card{position:relative;max-width:440px;width:100%;box-sizing:border-box;background:#fff;border:4px solid #ef4444;border-radius:22px;padding:28px 22px;text-align:center;color:#172033;box-shadow:0 0 0 9px rgba(239,68,68,.18);animation:dna-critical-pulse 2.6s ease-in-out infinite;}',
            '#dna-critical-maintenance-overlay .dna-critical-tag{display:inline-block;background:#fee2e2;color:#991b1b;border-radius:30px;padding:8px 12px;font-weight:900;font-size:12px;letter-spacing:.04em;}',
            '#dna-critical-maintenance-overlay .dna-critical-km{display:block;font-size:36px;line-height:1.18;font-weight:900;color:#b91c1c;margin:18px 0 8px;}',
            '#dna-critical-maintenance-overlay .dna-critical-item{display:block;font-size:19px;font-weight:850;margin:0 0 12px;overflow-wrap:anywhere;}',
            '#dna-critical-maintenance-overlay .dna-critical-explain{font-size:14px;line-height:1.55;color:#374151;margin:0 0 18px;}',
            '#dna-critical-maintenance-overlay button{display:block;width:100%;border-radius:12px;border:0;padding:13px 16px;font-size:15px;font-weight:850;cursor:pointer;margin-top:9px;}',
            '#dna-critical-maintenance-overlay .dna-critical-book{background:#b91c1c;color:white;}',
            '#dna-critical-maintenance-overlay .dna-critical-check{background:#e2e8f0;color:#172033;}',
            '#dna-critical-maintenance-overlay .dna-critical-later{background:transparent;color:#475569;text-decoration:underline;}',
            '@keyframes dna-critical-pulse{0%,100%{box-shadow:0 0 0 6px rgba(239,68,68,.10);}50%{box-shadow:0 0 0 12px rgba(239,68,68,.24);}}',
            '@media(prefers-reduced-motion:reduce){#dna-critical-maintenance-overlay .dna-critical-card{animation:none;}}',
            '</style>',
            '<div class="dna-critical-card">',
            '<div class="dna-critical-tag">ATENÇÃO • MANUTENÇÃO PRÓXIMA</div>',
            '<strong class="dna-critical-km" id="dna-critical-remaining"></strong>',
            '<strong class="dna-critical-item" id="dna-critical-name"></strong>',
            '<p class="dna-critical-explain">Agende uma avaliação preventiva para reduzir o risco de falhas inesperadas. A distância foi estimada pelo GPS: confirme o hodômetro real. Interaja somente com o carro parado.</p>',
            '<button class="dna-critical-book" type="button">Agendar manutenção</button>',
            '<button class="dna-critical-check" type="button">Informar km do painel</button>',
            '<button class="dna-critical-later" type="button">Agora não</button>',
            '</div>'
        ].join('');
        const km = Math.max(0, Math.round(Number(state.remainingKm) || 0));
        overlay.querySelector('#dna-critical-remaining').textContent = 'Faltam aproximadamente ' + km + ' km';
        overlay.querySelector('#dna-critical-name').textContent = String(state.targetName || 'Manutenção programada').slice(0, 100);
        const close = () => overlay.remove();
        overlay.querySelector('.dna-critical-book').addEventListener('click', () => {
            close();
            window.OwnerView.navigateTo('workshops');
        });
        overlay.querySelector('.dna-critical-check').addEventListener('click', () => {
            close();
            this._promptedOdometerThisSession = true;
            window.OwnerView.openOdometerModal();
        });
        overlay.querySelector('.dna-critical-later').addEventListener('click', close);
        document.body.appendChild(overlay);
        overlay.querySelector('.dna-critical-book').focus();
        return true;
    },

    async promptOdometerIfNeeded() {
        const native = this.nativePlugin();
        if (!native || document.hidden) return;
        try {
            const state = await native.getState();
            const urgentKey = [state?.plate, state?.targetName, state?.officialKm].join("|");
            if (state?.alert40 && this._urgentAlertShown !== urgentKey) {
                if (this.showUrgentMaintenance(state)) {
                    this._urgentAlertShown = urgentKey;
                    return;
                }
                if (state.moving && !this._urgentRetryScheduled) {
                    this._urgentRetryScheduled = true;
                    setTimeout(() => {
                        this._urgentRetryScheduled = false;
                        if (!document.hidden) this.promptOdometerIfNeeded();
                    }, 60000);
                }
                return;
            }
            if (this._promptedOdometerThisSession) return;
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
