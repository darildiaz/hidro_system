/**
 * Configuración del Sistema de Hidroponía Automatizado
 * Ing. Daril Díaz - 2024
 */

module.exports = {
  // Configuración del servidor
  server: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0'
  },

  // Configuración GPIO
  gpio: {
    // Pines para los 4 relés (GPIO numbering)
    relePins: [2, 3, 4, 18], // GPIO2, GPIO3, GPIO4, GPIO18
    
    // Pin para sensor DHT11
    dht11Pin: 17, // GPIO17
    
    // Configuración de relés (activos en bajo)
    releActiveLow: true,
    
    // Estado inicial de relés (false = apagado)
    releInitialState: false
  },

  // Configuración de sensores
  sensors: {
    // Intervalo de lectura DHT11 (en milisegundos)
    dht11Interval: 60000, // 1 minuto
    
    // Intervalo de verificación de condiciones (en milisegundos)
    conditionCheckInterval: 60000, // 1 minuto
    
    // Umbrales por defecto para alertas
    thresholds: {
      temperature: {
        min: 18, // °C
        max: 28  // °C
      },
      humidity: {
        min: 40, // %
        max: 80  // %
      }
    }
  },

  // Configuración de la base de datos
  database: {
    path: './data/auto_hidro.db',
    backupPath: './backups/',
    maxBackups: 10
  },

  // Configuración de logs
  logging: {
    level: 'info', // error, warn, info, debug
    maxFiles: 5,
    maxSize: '10m',
    directory: './logs/'
  },

  // Configuración de programación horaria
  scheduling: {
    // Intervalo de verificación de horarios (en milisegundos)
    checkInterval: 30000, // 30 segundos
    
    // Zona horaria
    timezone: 'America/Santo_Domingo'
  },

  // Configuración de seguridad
  security: {
    // Tiempo de sesión (en milisegundos)
    sessionTimeout: 3600000, // 1 hora
    
    // Máximo de intentos de conexión
    maxLoginAttempts: 5,
    
    // Bloqueo temporal (en milisegundos)
    lockoutDuration: 900000 // 15 minutos
  },

  // Configuración de notificaciones
  notifications: {
    // Habilitar notificaciones por email
    email: false,
    
    // Habilitar notificaciones por Telegram
    telegram: false,
    
    // Habilitar notificaciones en la interfaz web
    web: true
  },

  // Configuración de respaldo automático
  backup: {
    // Habilitar respaldo automático
    enabled: true,
    
    // Frecuencia de respaldo (en horas)
    frequency: 24,
    
    // Retener respaldos por (en días)
    retention: 30
  }
}; 