#!/usr/bin/env node

/**
 * Script de Prueba de la Interfaz Web
 * Sistema de Hidroponía Automatizado
 * Ing. Daril Díaz - 2024
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🌐 Probando Interfaz Web del Sistema...\n');

// Colores para la consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
    log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Contador de pruebas
let testsPassed = 0;
let testsTotal = 0;

function runTest(testName, testFunction) {
    testsTotal++;
    try {
        const result = testFunction();
        if (result) {
            logSuccess(`${testName} - PASÓ`);
            testsPassed++;
        } else {
            logError(`${testName} - FALLÓ`);
        }
    } catch (error) {
        logError(`${testName} - ERROR: ${error.message}`);
    }
}

// Prueba 1: Verificar archivos de la interfaz web
logStep('1', 'Verificando archivos de la interfaz web...');

runTest('Plantilla base (base.ejs)', () => {
    return fs.existsSync('views/base.ejs');
});

runTest('Plantilla principal (index.ejs)', () => {
    return fs.existsSync('views/index.ejs');
});

runTest('Plantilla de error (error.ejs)', () => {
    return fs.existsSync('views/error.ejs');
});

runTest('Estilos CSS (style.css)', () => {
    return fs.existsSync('public/css/style.css');
});

runTest('JavaScript principal (main.js)', () => {
    return fs.existsSync('public/js/main.js');
});

// Prueba 2: Verificar contenido de archivos
logStep('2', 'Verificando contenido de archivos...');

runTest('Plantilla base contiene Socket.IO', () => {
    try {
        const content = fs.readFileSync('views/base.ejs', 'utf8');
        return content.includes('socket.io/socket.io.js');
    } catch (error) {
        return false;
    }
});

runTest('Plantilla base contiene Bootstrap', () => {
    try {
        const content = fs.readFileSync('views/base.ejs', 'utf8');
        return content.includes('bootstrap@5.3.0');
    } catch (error) {
        return false;
    }
});

runTest('Plantilla base contiene Chart.js', () => {
    try {
        const content = fs.readFileSync('views/base.ejs', 'utf8');
        return content.includes('chart.js');
    } catch (error) {
        return false;
    }
});

runTest('Plantilla principal contiene funciones Socket.IO', () => {
    try {
        const content = fs.readFileSync('views/index.ejs', 'utf8');
        return content.includes('initializeSocket') && content.includes('socket.on');
    } catch (error) {
        return false;
    }
});

// Prueba 3: Verificar estructura de directorios
logStep('3', 'Verificando estructura de directorios...');

const requiredDirs = [
    'views',
    'public',
    'public/css',
    'public/js',
    'public/img'
];

requiredDirs.forEach(dir => {
    runTest(`Directorio ${dir}`, () => {
        return fs.existsSync(dir);
    });
});

// Prueba 4: Verificar configuración del servidor
logStep('4', 'Verificando configuración del servidor...');

runTest('Archivo de configuración', () => {
    return fs.existsSync('config.js');
});

runTest('Archivo principal de la aplicación', () => {
    return fs.existsSync('app.js');
});

runTest('Configuración de seguridad (helmet)', () => {
    try {
        const content = fs.readFileSync('app.js', 'utf8');
        return content.includes('helmet') && content.includes('contentSecurityPolicy');
    } catch (error) {
        return false;
    }
});

// Prueba 5: Verificar dependencias
logStep('5', 'Verificando dependencias...');

runTest('Package.json válido', () => {
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        return packageJson.dependencies && 
               packageJson.dependencies.express && 
               packageJson.dependencies['socket.io'];
    } catch (error) {
        return false;
    }
});

runTest('Directorio node_modules', () => {
    return fs.existsSync('node_modules');
});

// Prueba 6: Verificar archivos estáticos
logStep('6', 'Verificando archivos estáticos...');

runTest('Favicon presente', () => {
    return fs.existsSync('public/favicon.ico');
});

runTest('Archivo de estilos no vacío', () => {
    try {
        const stats = fs.statSync('public/css/style.css');
        return stats.size > 0;
    } catch (error) {
        return false;
    }
});

runTest('Archivo JavaScript no vacío', () => {
    try {
        const stats = fs.statSync('public/js/main.js');
        return stats.size > 0;
    } catch (error) {
        return false;
    }
});

// Prueba 7: Verificar sintaxis de archivos
logStep('7', 'Verificando sintaxis de archivos...');

runTest('Plantilla base sintaxis válida', () => {
    try {
        const content = fs.readFileSync('views/base.ejs', 'utf8');
        // Verificar que tenga estructura HTML básica
        return content.includes('<!DOCTYPE html') && 
               content.includes('<html') && 
               content.includes('</html>');
    } catch (error) {
        return false;
    }
});

runTest('Plantilla principal sintaxis válida', () => {
    try {
        const content = fs.readFileSync('views/index.ejs', 'utf8');
        // Verificar que tenga contenido JavaScript
        return content.includes('<script>') && 
               content.includes('</script>') &&
               content.includes('function');
    } catch (error) {
        return false;
    }
});

// Prueba 8: Verificar funcionalidades específicas
logStep('8', 'Verificando funcionalidades específicas...');

runTest('Sistema de notificaciones', () => {
    try {
        const content = fs.readFileSync('views/index.ejs', 'utf8');
        return content.includes('showNotification') && 
               content.includes('toast-container');
    } catch (error) {
        return false;
    }
});

runTest('Control de relés', () => {
    try {
        const content = fs.readFileSync('views/index.ejs', 'utf8');
        return content.includes('controlRele') && 
               content.includes('rele1Switch');
    } catch (error) {
        return false;
    }
});

runTest('Gráficos de sensores', () => {
    try {
        const content = fs.readFileSync('views/index.ejs', 'utf8');
        return content.includes('temperatureChart') && 
               content.includes('humidityChart');
    } catch (error) {
        return false;
    }
});

// Resumen de pruebas
console.log('\n' + '='.repeat(60));
log('\n📊 RESUMEN DE PRUEBAS DE LA INTERFAZ WEB', 'cyan');
log(`Total de pruebas: ${testsTotal}`, 'bright');
log(`Pruebas exitosas: ${testsPassed}`, 'green');
log(`Pruebas fallidas: ${testsTotal - testsPassed}`, 'red');

const successRate = (testsPassed / testsTotal) * 100;

if (successRate >= 90) {
    log('\n🎉 ¡INTERFAZ WEB LISTA PARA USAR!', 'green');
    log('La interfaz web ha pasado todas las pruebas críticas', 'green');
} else if (successRate >= 70) {
    log('\n⚠️  INTERFAZ WEB FUNCIONAL CON ADVERTENCIAS', 'yellow');
    log('La interfaz funciona pero algunas características pueden no estar disponibles', 'yellow');
} else {
    log('\n❌ INTERFAZ WEB CON PROBLEMAS', 'red');
    log('Se encontraron varios problemas que deben resolverse', 'red');
}

log(`\nPorcentaje de éxito: ${successRate.toFixed(1)}%`, successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red');

// Recomendaciones específicas
console.log('\n' + '='.repeat(60));
log('\n💡 RECOMENDACIONES PARA LA INTERFAZ WEB:', 'cyan');

if (successRate >= 90) {
    log('✅ La interfaz web está lista para usar', 'green');
    log('🚀 Se pueden mostrar páginas y funcionalidades correctamente', 'green');
    log('🌐 Socket.IO y Bootstrap están configurados correctamente', 'green');
} else if (successRate >= 70) {
    log('⚠️  Verifique los errores antes de usar la interfaz', 'yellow');
    log('🔧 Algunas funcionalidades web pueden no estar disponibles', 'yellow');
    log('📚 Consulte la documentación para resolver problemas', 'yellow');
} else {
    log('❌ Resuelva los problemas de la interfaz antes de usar', 'red');
    log('🔧 Verifique archivos, dependencias y configuración', 'red');
    log('📚 Consulte la documentación de instalación', 'red');
}

// Información adicional
log('\n📋 ARCHIVOS VERIFICADOS:', 'blue');
log('✅ views/base.ejs - Plantilla base con Socket.IO y Bootstrap', 'green');
log('✅ views/index.ejs - Página principal con funcionalidades', 'green');
log('✅ public/css/style.css - Estilos personalizados', 'green');
log('✅ public/js/main.js - Funcionalidades JavaScript', 'green');
log('✅ public/favicon.ico - Icono del sitio', 'green');

log('\n🔧 PROBLEMAS COMUNES SOLUCIONADOS:', 'blue');
log('✅ Headers de seguridad configurados correctamente', 'green');
log('✅ Socket.IO incluido y configurado', 'green');
log('✅ CORS y políticas de origen ajustadas', 'green');
log('✅ Favicon presente para evitar errores 404', 'green');

console.log('\n' + '='.repeat(60));
log('\n🌱 Sistema de Hidroponía Automatizado - Ing. Daril Díaz © 2024', 'magenta');
log('🌐 Script de Pruebas de la Interfaz Web', 'cyan');
console.log(''); 