// ==============================================================================
// DNA AUTO — CONTROLADOR CENTRAL DAS LANDING PAGES
// Roteia de forma limpa entre:
// /           -> LandingHomeView (Home de escolha de perfil)
// /cliente    -> LandingClientView (Exclusiva para proprietários de veículos)
// /autocente  -> LandingWorkshopView (Exclusiva para oficinas / auto centers)
// ==============================================================================

const LandingView = {
    render(targetRoute) {
        const path = targetRoute || window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
        const hash = window.location.hash.toLowerCase();

        if (path === '/cliente' || hash === '#cliente') {
            if (typeof LandingClientView !== 'undefined') {
                LandingClientView.render();
            }
        } else if (path === '/autocente' || path === '/autocenter' || hash === '#autocente' || hash === '#autocenter') {
            if (typeof LandingWorkshopView !== 'undefined') {
                LandingWorkshopView.render();
            }
        } else {
            if (typeof LandingHomeView !== 'undefined') {
                LandingHomeView.render();
            }
        }
    },

    // Acesso direto ao fluxo de credenciamento oficial da oficina
    goToRegisterWorkshop() {
        if (typeof App !== 'undefined' && App.goToRegisterWorkshop) {
            App.goToRegisterWorkshop();
        } else if (typeof LoginView !== 'undefined') {
            LoginView.selectedRoleTab = 'WORKSHOP';
            LoginView.activeMode = 'REGISTER';
            if (typeof App !== 'undefined') App.switchView('login');
            else LoginView.render();
        }
    },

    // Acesso direto ao cadastro de cliente
    goToRegister() {
        if (typeof LoginView !== 'undefined') {
            LoginView.selectedRoleTab = 'OWNER';
            LoginView.activeMode = 'REGISTER';
            if (typeof App !== 'undefined') App.switchView('login');
            else LoginView.render();
        }
    }
};

window.LandingView = LandingView;
