#!/usr/bin/env node

/**
 * Script de Prueba del Sistema
 * Sistema de Hidroponía Automatizado
 * Ing. Daril Díaz - 2024
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Probando Sistema de Hidroponía...\n');

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

// Prueba 1: Verificar Node.js
logStep('1', 'Verificando entorno Node.js...');

runTest('Versión de Node.js', () => {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    logInfo(`Node.js ${nodeVersion} detectado`);
    return majorVersion >= 16;
});

runTest('Versión de npm', () => {
    try {
        const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
        logInfo(`npm ${npmVersion} detectado`);
        return true;
    } catch (error) {
        return false;
    }
});

// Prueba 2: Verificar archivos del sistema
logStep('2', 'Verificando archivos del sistema...');

const requiredFiles = [
    'package.json',
    'config.js',
    'app.js',
    'database.js',
    'gpio_controller.js',
    'scheduler.js',
    'dht11_sensor.js'
];

requiredFiles.forEach(file => {
    runTest(`Archivo ${file}`, () => {
        return fs.existsSync(file);
    });
});

// Prueba 3: Verificar dependencias
logStep('3', 'Verificando dependencias...');

runTest('Directorio node_modules', () => {
    return fs.existsSync('node_modules');
});

runTest('Package.json válido', () => {
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        return packageJson.name && packageJson.version;
    } catch (error) {
        return false;
    }
});

// Prueba 4: Verificar módulos del sistema
logStep('4', 'Verificando módulos del sistema...');

runTest('Módulo de configuración', () => {
    try {
        const config = require('./config.js');
        return config.server && config.gpio;
    } catch (error) {
        return false;
    }
});

runTest('Módulo de base de datos', () => {
    try {
        const Database = require('./database.js');
        return typeof Database === 'function';
    } catch (error) {
        return false;
    }
});

runTest('Módulo de sensor DHT11', () => {
    try {
        const DHT11Sensor = require('./dht11_sensor.js');
        return typeof DHT11Sensor === 'function';
    } catch (error) {
        return false;
    }
});

runTest('Módulo de controlador GPIO', () => {
    try {
        const GPIOController = require('./gpio_controller.js');
        return typeof GPIOController === 'function';
    } catch (error) {
        return false;
    }
});

runTest('Módulo de programador', () => {
    try {
        const Scheduler = require('./scheduler.js');
        return typeof Scheduler === 'function';
    } catch (error) {
        return false;
    }
});

// Prueba 5: Verificar plantillas y archivos estáticos
logStep('5', 'Verificando plantillas y archivos estáticos...');

const requiredViews = [
    'views/base.ejs',
    'views/index.ejs',
    'views/error.ejs'
];

requiredViews.forEach(view => {
    runTest(`Plantilla ${view}`, () => {
        return fs.existsSync(view);
    });
});

const requiredStatic = [
    'public/css/style.css',
    'public/js/main.js'
];

requiredStatic.forEach(staticFile => {
    runTest(`Archivo estático ${staticFile}`, () => {
        return fs.existsSync(staticFile);
    });
});

// Prueba 6: Verificar directorios
logStep('6', 'Verificando estructura de directorios...');

const requiredDirs = [
    'data',
    'logs',
    'backups',
    'public/css',
    'public/js',
    'public/img',
    'views'
];

requiredDirs.forEach(dir => {
    runTest(`Directorio ${dir}`, () => {
        return fs.existsSync(dir);
    });
});

// Prueba 7: Verificar scripts de control
logStep('7', 'Verificando scripts de control...');

const requiredScripts = [
    'start.sh',
    'stop.sh',
    'restart.sh',
    'status.sh'
];

requiredScripts.forEach(script => {
    runTest(`Script ${script}`, () => {
        return fs.existsSync(script);
    });
});

// Prueba 8: Verificar sensor DHT11
logStep('8', 'Probando sensor DHT11...');

runTest('Inicialización del sensor', () => {
    try {
        const DHT11Sensor = require('./dht11_sensor.js');
        const sensor = new DHT11Sensor(17); // GPIO17
        return sensor.isInitialized;
    } catch (error) {
        return false;
    }
});

runTest('Lectura del sensor', () => {
    try {
        const DHT11Sensor = require('./dht11_sensor.js');
        const sensor = new DHT11Sensor(17);
        const reading = sensor.read();
        return reading && reading.temperature !== null && reading.humidity !== null;
    } catch (error) {
        return false;
    }
});

// Prueba 9: Verificar base de datos
logStep('9', 'Probando base de datos...');

runTest('Inicialización de base de datos', () => {
    try {
        const Database = require('./database.js');
        const db = new Database();
        return db !== null;
    } catch (error) {
        return false;
    }
});

// Prueba 10: Verificar configuración
logStep('10', 'Verificando configuración del sistema...');

runTest('Configuración del servidor', () => {
    try {
        const config = require('./config.js');
        return config.server && config.server.port;
    } catch (error) {
        return false;
    }
});

runTest('Configuración GPIO', () => {
    try {
        const config = require('./config.js');
        return config.gpio && config.gpio.relePins && config.gpio.dht11Pin;
    } catch (error) {
        return false;
    }
});

// Resumen de pruebas
console.log('\n' + '='.repeat(60));
log('\n📊 RESUMEN DE PRUEBAS', 'cyan');
log(`Total de pruebas: ${testsTotal}`, 'bright');
log(`Pruebas exitosas: ${testsPassed}`, 'green');
log(`Pruebas fallidas: ${testsTotal - testsPassed}`, 'red');

const successRate = (testsPassed / testsTotal) * 100;

if (successRate >= 90) {
    log('\n🎉 ¡SISTEMA LISTO PARA USAR!', 'green');
    log('El sistema ha pasado todas las pruebas críticas', 'green');
} else if (successRate >= 70) {
    log('\n⚠️  SISTEMA FUNCIONAL CON ADVERTENCIAS', 'yellow');
    log('El sistema funciona pero algunas características pueden no estar disponibles', 'yellow');
} else {
    log('\n❌ SISTEMA CON PROBLEMAS', 'red');
    log('Se encontraron varios problemas que deben resolverse', 'red');
}

log(`\nPorcentaje de éxito: ${successRate.toFixed(1)}%`, successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red');

// Recomendaciones
console.log('\n' + '='.repeat(60));
log('\n💡 RECOMENDACIONES:', 'cyan');

if (successRate >= 90) {
    log('✅ El sistema está listo para iniciar', 'green');
    log('🚀 Ejecute: node app.js', 'yellow');
    log('🌐 Acceda a: http://localhost:3000', 'yellow');
} else if (successRate >= 70) {
    log('⚠️  Verifique los errores antes de usar', 'yellow');
    log('🔧 Algunas funcionalidades pueden no estar disponibles', 'yellow');
    log('📚 Consulte la documentación para resolver problemas', 'yellow');
} else {
    log('❌ Resuelva los problemas antes de usar', 'red');
    log('🔧 Ejecute: node install_simple.js', 'yellow');
    log('📚 Consulte la documentación de instalación', 'yellow');
}

console.log('\n' + '='.repeat(60));
log('\n🌱 Sistema de Hidroponía Automatizado - Ing. Daril Díaz © 2024', 'magenta');
log('🧪 Script de Pruebas del Sistema', 'cyan');
console.log(''); 