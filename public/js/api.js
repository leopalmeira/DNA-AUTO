// ==============================================================================
// DNA AUTO — CLIENTE DE API REST
// ==============================================================================

const API = {
    baseUrl: '/api/v1',
    token: localStorage.getItem('dna_auto_token') || null,
    currentDemoUserId: localStorage.getItem('dna_auto_demo_user_id') || 'usr_admin',

    setToken(token) {
        this.token = token;
        if (token) localStorage.setItem('dna_auto_token', token);
        else localStorage.removeItem('dna_auto_token');
    },

    setDemoUser(userId) {
        this.currentDemoUserId = userId;
        if (userId) localStorage.setItem('dna_auto_demo_user_id', userId);
    },

    async request(endpoint, options = {}) {
        const headers = options.headers || {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        if (this.currentDemoUserId) {
            headers['X-Demo-User-Id'] = this.currentDemoUserId;
        }

        if (!(options.body instanceof FormData) && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        options.headers = headers;

        try {
            const res = await fetch(`${this.baseUrl}${endpoint}`, options);
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error || data.message || `Erro HTTP ${res.status}`);
            }
            return data;
        } catch (err) {
            console.error(`Falha na requisição [${endpoint}]:`, err.message);
            throw err;
        }
    },

    // Auth
    login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },
    registerClient(data) {
        return this.request('/auth/register-client', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    registerWorkshop(data) {
        return this.request('/auth/register-workshop', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    resetPassword(email, newPassword) {
        return this.request('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email, newPassword })
        });
    },
    getMe() {
        return this.request('/auth/me');
    },
    getDemoUsers() {
        return this.request('/auth/demo-users');
    },

    // Dossiê e Lupa
    getDossier(identifier) {
        return this.request(`/dossier/${encodeURIComponent(identifier)}`);
    },
    searchInDossier(identifier, query) {
        return this.request(`/dossier/${encodeURIComponent(identifier)}/search?q=${encodeURIComponent(query)}`);
    },

    // Veículos e DNA
    searchVehicle(query) {
        return this.request(`/vehicles/search?q=${encodeURIComponent(query)}`);
    },
    activateDna(data) {
        return this.request('/vehicles/activate-dna', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    registerVehicle(data) {
        return this.request('/vehicles/register', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    registerVehicleFromApi(plate, customData, activateDnaNow = false) {
        return this.request('/vehicles/register-from-api', {
            method: 'POST',
            body: JSON.stringify({ plate, customData, activate_dna_now: activateDnaNow })
        });
    },

    // Oficinas
    getWorkshops() {
        return this.request('/workshops');
    },
    getWorkshopRanking() {
        return this.request('/workshops/ranking/most-active');
    },
    getWorkshopDashboard(workshopId) {
        return this.request(`/workshops/${workshopId}/dashboard`);
    },
    getMaintenanceAlertsForWorkshop(workshopId) {
        return this.request(`/workshops/${workshopId}/maintenance-alerts`);
    },
    updateWorkshopStatus(workshopId, status) {
        return this.request(`/workshops/${workshopId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    },

    // Serviços
    getPartsCatalog() {
        return this.request('/services/catalog/parts');
    },
    registerWorkshopService(formData) {
        return this.request('/services/workshop-register', {
            method: 'POST',
            body: formData
        });
    },
    confirmServiceDecision(serviceId, decision, notes) {
        return this.request(`/services/${serviceId}/confirm-decision`, {
            method: 'POST',
            body: JSON.stringify({ decision, notes })
        });
    },
    declareOwnerService(formData) {
        return this.request('/services/owner-declare', {
            method: 'POST',
            body: formData
        });
    },

    // Transferências
    requestTransfer(data) {
        return this.request('/transfers/request', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    confirmTransfer(data) {
        return this.request('/transfers/confirm', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    // Administrativo e Planos
    getNetworkStats() {
        return this.request('/admin/network-stats');
    },
    getWorkshopClients(workshopId) {
        return this.request(`/admin/workshops/${encodeURIComponent(workshopId)}/clients`);
    },
    getFleet(workshopId = 'all') {
        return this.request(`/admin/fleet?workshop_id=${encodeURIComponent(workshopId)}`);
    },
    getAllClients(workshopId = 'all') {
        return this.request(`/admin/clients-all?workshop_id=${encodeURIComponent(workshopId)}`);
    },
    setWorkshopStatus(workshopId, status) {
        return this.request(`/admin/workshops/${encodeURIComponent(workshopId)}/status`, {
            method: 'POST',
            body: JSON.stringify({ status })
        });
    },
    getMaintenanceAlerts() {
        return this.request('/admin/maintenance-alerts');
    },
    getAuditLogs(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/admin/audit-logs?${query}`);
    },
    getPricingPlans() {
        return this.request('/billing/plans');
    },
    savePricingPlan(plan) {
        return this.request('/billing/plans', {
            method: 'POST',
            body: JSON.stringify(plan)
        });
    },

    // Relatórios
    generateSaleReport(vehicleId) {
        return this.request('/reports/generate-sale-report', {
            method: 'POST',
            body: JSON.stringify({ vehicle_id: vehicleId })
        });
    },
    validateReport(code) {
        return this.request(`/reports/validate/${code}`);
    },

    // Integrações
    getIntegrations() {
        return this.request('/integrations/status');
    },
    lookupPlate(plate) {
        return this.request(`/integrations/plate-lookup/${encodeURIComponent(plate)}`);
    },
    registerVehicleFromApi(plate, customData = null, activateDnaNow = false) {
        return this.request('/vehicles/register-from-api', {
            method: 'POST',
            body: JSON.stringify({
                plate,
                customData,
                activate_dna_now: activateDnaNow
            })
        });
    },

    // Agendamentos e Agenda da Oficina
    getWorkshopAppointments(workshopId) {
        return this.request(`/workshops/${encodeURIComponent(workshopId)}/appointments`);
    },
    createWorkshopAppointment(workshopId, data) {
        return this.request(`/workshops/${encodeURIComponent(workshopId)}/appointments`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    updateAppointmentStatus(workshopId, appointmentId, status) {
        return this.request(`/workshops/${encodeURIComponent(workshopId)}/appointments/${encodeURIComponent(appointmentId)}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
    }
};
