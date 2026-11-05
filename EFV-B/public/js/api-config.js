/**
 * EFV API Configuration - Core System
 */
const CONFIG = {
    // Determine API Base URL from dynamic runtime or fallback to origin
    API_BASE_URL: (window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1'))
        ? 'http://localhost:8080'
        : window.location.origin,
    GOOGLE_CLIENT_ID: '246449377479-favi4q5sskhc1hnljs53aik69ftnr6bf.apps.googleusercontent.com',
    UNIFIED_API_URL: 'https://uwo24.com/api',
    UWO_API_KEY: '',
    BASE_PATH: window.location.pathname.includes('/pages/') ? '../' : ''
};

// Global Exposure
window.API_BASE = CONFIG.API_BASE_URL;

console.log(`🔗 EFV API connected to: ${CONFIG.API_BASE_URL}`);
