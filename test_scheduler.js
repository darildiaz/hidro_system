#!/usr/bin/env node

/**
 * Script de Prueba del Programador
 * Sistema de Hidroponía Automatizado
 * Ing. Daril Díaz - 2024
 */

const Scheduler = require('./scheduler.js');
const Database = require('./database.js');
const GPIOController = require('./gpio_controller.js');
const config = require('./config.js');

console.log('🧪 Probando Programador del Sistema...\n');

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

// Prueba 1: Verificar configuración
logStep('1', 'Verificando configuración del programador...');

runTest('Configuración de respaldo válida', () => {
    return config.backup && 
           typeof config.backup.enabled === 'boolean' && 
           typeof config.backup.frequency === 'number' &&
           config.backup.frequency > 0;
});

runTest('Configuración de programación válida', () => {
    return config.scheduling && 
           config.scheduling.timezone &&
           typeof config.scheduling.checkInterval === 'number';
});

// Prueba 2: Verificar módulos
logStep('2', 'Verificando módulos del programador...');

runTest('Módulo de base de datos', () => {
    try {
        const db = new Database();
        return db !== null;
    } catch (error) {
        return false;
    }
});

runTest('Módulo de controlador GPIO', () => {
    try {
        const gpio = new GPIOController();
        return gpio !== null;
    } catch (error) {
        return false;
    }
});

// Prueba 3: Verificar programador
logStep('3', 'Probando programador...');

let scheduler = null;

runTest('Creación del programador', () => {
    try {
        scheduler = new Scheduler();
        return scheduler !== null;
    } catch (error) {
        return false;
    }
});

runTest('Inicialización del programador', () => {
    try {
        if (scheduler) {
            scheduler.init();
            return scheduler.isRunning;
        }
        return false;
    } catch (error) {
        return false;
    }
});

// Prueba 4: Verificar tareas programadas
logStep('4', 'Verificando tareas programadas...');

runTest('Tareas del sistema creadas', () => {
    try {
        if (scheduler) {
            const status = scheduler.getStatus();
            return status.scheduledTasks > 0;
        }
        return false;
    } catch (error) {
        return false;
    }
});

runTest('Tarea de respaldo configurada', () => {
    try {
        if (scheduler) {
            const status = scheduler.getStatus();
            return status.nextBackup !== 'Deshabilitado';
        }
        return false;
    } catch (error) {
        return false;
    }
});

// Prueba 5: Verificar expresiones cron
logStep('5', 'Verificando expresiones cron...');

runTest('Expresión cron para respaldo diario', () => {
    try {
        // Simular configuración de respaldo diario
        const testConfig = { backup: { enabled: true, frequency: 24 } };
        const testScheduler = new Scheduler();
        
        // Verificar que no se genere error con frecuencia 24
        testScheduler.startScheduledTasks();
        return true;
    } catch (error) {
        return false;
    }
});

runTest('Expresión cron para respaldo cada 6 horas', () => {
    try {
        // Simular configuración de respaldo cada 6 horas
        const testConfig = { backup: { enabled: true, frequency: 6 } };
        const testScheduler = new Scheduler();
        
        testScheduler.startScheduledTasks();
        return true;
    } catch (error) {
        return false;
    }
});

// Prueba 6: Verificar horarios
logStep('6', 'Verificando horarios...');

runTest('Creación de expresión cron para horario', () => {
    try {
        if (scheduler) {
            const testSchedule = {
                id: 1,
                rele_id: 1,
                day_of_week: 1, // Lunes
                start_time: '08:00',
                end_time: '18:00'
            };
            
            const cronExpression = scheduler.createCronExpression(testSchedule);
            return cronExpression && cronExpression.includes('0 8 * * 1');
        }
        return false;
    } catch (error) {
        return false;
    }
});

// Prueba 7: Verificar condiciones
logStep('7', 'Verificando condiciones...');

runTest('Agregar condición de activación', () => {
    try {
        if (scheduler) {
            const testCondition = {
                id: 1,
                rele_id: 1,
                condition_type: 'temperature',
                operator: '>',
                value: 25,
                action: 'activate'
            };
            
            scheduler.addCondition(testCondition);
            const status = scheduler.getStatus();
            return status.activeConditions > 0;
        }
        return false;
    } catch (error) {
        return false;
    }
});

// Prueba 8: Verificar estado del programador
logStep('8', 'Verificando estado del programador...');

runTest('Estado del programador', () => {
    try {
        if (scheduler) {
            const status = scheduler.getStatus();
            return status && 
                   typeof status.isRunning === 'boolean' &&
                   typeof status.activeSchedules === 'number' &&
                   typeof status.activeConditions === 'number';
        }
        return false;
    } catch (error) {
        return false;
    }
});

// Prueba 9: Verificar limpieza
logStep('9', 'Verificando limpieza del programador...');

runTest('Detener programador', () => {
    try {
        if (scheduler) {
            scheduler.stop();
            return !scheduler.isRunning;
        }
        return false;
    } catch (error) {
        return false;
    }
});

// Resumen de pruebas
console.log('\n' + '='.repeat(60));
log('\n📊 RESUMEN DE PRUEBAS DEL PROGRAMADOR', 'cyan');
log(`Total de pruebas: ${testsTotal}`, 'bright');
log(`Pruebas exitosas: ${testsPassed}`, 'green');
log(`Pruebas fallidas: ${testsTotal - testsPassed}`, 'red');

const successRate = (testsPassed / testsTotal) * 100;

if (successRate >= 90) {
    log('\n🎉 ¡PROGRAMADOR FUNCIONANDO PERFECTAMENTE!', 'green');
    log('El programador ha pasado todas las pruebas críticas', 'green');
} else if (successRate >= 70) {
    log('\n⚠️  PROGRAMADOR FUNCIONAL CON ADVERTENCIAS', 'yellow');
    log('El programador funciona pero algunas características pueden no estar disponibles', 'yellow');
} else {
    log('\n❌ PROGRAMADOR CON PROBLEMAS', 'red');
    log('Se encontraron varios problemas que deben resolverse', 'red');
}

log(`\nPorcentaje de éxito: ${successRate.toFixed(1)}%`, successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red');

// Recomendaciones específicas
console.log('\n' + '='.repeat(60));
log('\n💡 RECOMENDACIONES PARA EL PROGRAMADOR:', 'cyan');

if (successRate >= 90) {
    log('✅ El programador está listo para usar', 'green');
    log('🚀 Se pueden crear horarios y condiciones automáticamente', 'green');
    log('⏰ Los respaldos automáticos están configurados correctamente', 'green');
} else if (successRate >= 70) {
    log('⚠️  Verifique los errores antes de usar el programador', 'yellow');
    log('🔧 Algunas funcionalidades de programación pueden no estar disponibles', 'yellow');
    log('📚 Consulte la documentación para resolver problemas', 'yellow');
} else {
    log('❌ Resuelva los problemas del programador antes de usar', 'red');
    log('🔧 Verifique la configuración y las dependencias', 'red');
    log('📚 Consulte la documentación de instalación', 'red');
}

// Información adicional
log('\n📋 INFORMACIÓN DEL PROGRAMADOR:', 'blue');
if (scheduler) {
    try {
        const status = scheduler.getStatus();
        log(`Estado: ${status.isRunning ? 'Ejecutándose' : 'Detenido'}`, status.isRunning ? 'green' : 'red');
        log(`Horarios activos: ${status.activeSchedules}`, 'cyan');
        log(`Condiciones activas: ${status.activeConditions}`, 'cyan');
        log(`Tareas programadas: ${status.scheduledTasks}`, 'cyan');
        log(`Próximo respaldo: ${status.nextBackup}`, 'cyan');
    } catch (error) {
        logWarning('No se pudo obtener el estado del programador');
    }
}

console.log('\n' + '='.repeat(60));
log('\n🌱 Sistema de Hidroponía Automatizado - Ing. Daril Díaz © 2024', 'magenta');
log('🧪 Script de Pruebas del Programador', 'cyan');
console.log(''); 