// ===== CONFIGURACIÓN CENTRALIZADA DEL SISTEMA AUTO HIDRO =====

window.AutoHidroConfig = {
    // URLs del sistema
    baseUrl: 'http://192.168.1.39:3000',
    
    // Endpoints de la API
    api: {
        sensors: {
            current: '/api/sensors/current'
        },
        scheduler: {
            schedules: '/api/scheduler/schedules',
            conditions: '/api/scheduler/conditions',
            start: '/api/scheduler/start',
            stop: '/api/scheduler/stop',
            status: '/api/scheduler/status'
        },
        rele: {
            control: '/api/rele'
        },
        system: {
            status: '/api/system/status',
            control: '/api/system/control'
        }
    },
    
    // Configuración de Socket.IO
    socket: {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
    },
    
    // Configuración de la interfaz
    ui: {
        refreshInterval: 5000, // 5 segundos
        notificationDuration: 5000, // 5 segundos
        chartMaxPoints: 20
    },
    
    // Configuración de desarrollo
    development: {
        forceHttp: true,
        debugMode: true,
        logLevel: 'info'
    }
};

// ===== FUNCIONES UTILITARIAS DE CONFIGURACIÓN =====

// Obtener URL completa de la API
function getApiUrl(endpoint) {
    return AutoHidroConfig.baseUrl + endpoint;
}

// Obtener URL del sistema
function getSystemUrl(path = '') {
    return AutoHidroConfig.baseUrl + path;
}

// Verificar si estamos en modo desarrollo
function isDevelopment() {
    return AutoHidroConfig.development.debugMode;
}

// Log con nivel de debug
function debugLog(message, level = 'info') {
    if (isDevelopment()) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        switch (level) {
            case 'error':
                console.error(logMessage);
                break;
            case 'warn':
                console.warn(logMessage);
                break;
            case 'debug':
                console.debug(logMessage);
                break;
            default:
                console.log(logMessage);
        }
    }
}

// Exportar funciones para uso global
window.AutoHidroUtils = {
    ...window.AutoHidroUtils,
    getApiUrl,
    getSystemUrl,
    isDevelopment,
    debugLog
};

console.log('✅ Configuración del sistema AutoHidro cargada'); 