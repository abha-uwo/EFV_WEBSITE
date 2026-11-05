/**
 * EFV API Configuration
 */
const CONFIG = {
    // FORCE LOCALHOST ONLY
    API_BASE_URL: (window.location.hostname.includes('efv-') || window.location.hostname.includes('.run.app') || window.location.hostname.includes('.app'))
        ? 'https://efvbackend-743928421487.asia-south1.run.app'
        : 'http://localhost:8080',
    BASE_PATH: window.location.pathname.includes('/pages/') ? '../' : ''
};

console.log(`🔗 EFV API connected to: ${CONFIG.API_BASE_URL}`);
