/**
 * Configuración de Desarrollo
 * Sistema de Hidroponía Automatizado
 * Resuelve problemas de seguridad para desarrollo local
 * Ing. Daril Díaz - 2024
 */

const baseConfig = require('./config');

module.exports = {
  ...baseConfig,
  
  // Configuración del servidor para desarrollo
  server: {
    port: process.env.PORT || 3000,
    host: '0.0.0.0' // Permitir acceso desde cualquier IP en desarrollo
  },

  // Configuración de seguridad relajada para desarrollo
  security: {
    ...baseConfig.security,
    // Deshabilitar algunas restricciones de seguridad para desarrollo
    relaxedCSP: true,
    allowInlineScripts: true
  },

  // Configuración de desarrollo
  development: {
    enabled: true,
    debugMode: true,
    allowUnsafeInline: true,
    disableStrictCSP: true
  }
}; 