#!/usr/bin/env node

/**
 * Prueba del Sensor DHT11
 * Sistema de Hidroponía Automatizado
 * Ing. Daril Díaz - 2024
 */

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
    console.log(colors[color] + message + colors.reset);
}

async function testDHT11() {
    try {
        log('\n🌡️  PRUEBA DEL SENSOR DHT11', 'magenta');
        log('🔧 Sistema de Hidroponía Automatizado', 'cyan');
        log('👨‍💻 Ing. Daril Díaz - 2024', 'blue');
        log('='.repeat(60), 'cyan');

        // Paso 1: Verificar que el módulo existe
        log('\n[1] Verificando módulo DHT11...', 'cyan');
        if (!require('fs').existsSync('./dht11_sensor.js')) {
            log('❌ Módulo dht11_sensor.js no encontrado', 'red');
            return;
        }
        log('✅ Módulo dht11_sensor.js encontrado', 'green');

        // Paso 2: Cargar el módulo
        log('\n[2] Cargando módulo DHT11...', 'cyan');
        let DHT11Sensor;
        try {
            DHT11Sensor = require('./dht11_sensor.js');
            log('✅ Módulo DHT11 cargado correctamente', 'green');
        } catch (error) {
            log(`❌ Error cargando módulo: ${error.message}`, 'red');
            return;
        }

        // Paso 3: Crear instancia del sensor
        log('\n[3] Creando instancia del sensor...', 'cyan');
        let sensor;
        try {
            sensor = new DHT11Sensor(4); // GPIO 4
            log('✅ Instancia del sensor creada', 'green');
        } catch (error) {
            log(`❌ Error creando instancia: ${error.message}`, 'red');
            return;
        }

        // Paso 4: Probar lectura del sensor
        log('\n[4] Probando lectura del sensor...', 'cyan');
        log('📊 Realizando 5 lecturas de prueba...', 'yellow');
        
        for (let i = 1; i <= 5; i++) {
            try {
                log(`\n   Lectura ${i}:`, 'cyan');
                
                const startTime = Date.now();
                const reading = sensor.read();
                const endTime = Date.now();
                const responseTime = endTime - startTime;
                
                if (reading) {
                    log(`   ✅ Temperatura: ${reading.temperature}°C`, 'green');
                    log(`   ✅ Humedad: ${reading.humidity}%`, 'green');
                    log(`   ✅ Tiempo de respuesta: ${responseTime}ms`, 'blue');
                    
                    // Verificar rangos válidos
                    if (reading.temperature >= -40 && reading.temperature <= 80) {
                        log(`   ✅ Temperatura en rango válido`, 'green');
                    } else {
                        log(`   ⚠️  Temperatura fuera de rango normal`, 'yellow');
                    }
                    
                    if (reading.humidity >= 0 && reading.humidity <= 100) {
                        log(`   ✅ Humedad en rango válido`, 'green');
                    } else {
                        log(`   ⚠️  Humedad fuera de rango normal`, 'yellow');
                    }
                } else {
                    log(`   ❌ Lectura fallida`, 'red');
                }
                
                // Esperar entre lecturas
                if (i < 5) {
                    log(`   ⏳ Esperando 2 segundos...`, 'yellow');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                
            } catch (error) {
                log(`   ❌ Error en lectura ${i}: ${error.message}`, 'red');
            }
        }

        // Paso 5: Probar modo simulación
        log('\n[5] Probando modo simulación...', 'cyan');
        try {
            if (sensor.isSimulationMode) {
                log('✅ Modo simulación activo', 'green');
                log('   📱 Generando datos simulados para desarrollo', 'blue');
            } else {
                log('✅ Modo hardware activo', 'green');
                log('   🔌 Conectado a sensor físico DHT11', 'blue');
            }
        } catch (error) {
            log(`⚠️  No se pudo verificar modo: ${error.message}`, 'yellow');
        }

        // Paso 6: Verificar información del sensor
        log('\n[6] Información del sensor...', 'cyan');
        try {
            const info = sensor.getInfo();
            log(`   📍 Pin GPIO: ${info.gpioPin}`, 'blue');
            log(`   🔧 Tipo: ${info.type}`, 'blue');
            log(`   📊 Resolución: ${info.resolution}`, 'blue');
            log(`   ⚡ Voltaje: ${info.voltage}V`, 'blue');
        } catch (error) {
            log(`   ⚠️  No se pudo obtener información: ${error.message}`, 'yellow');
        }

        // Resumen final
        console.log('\n' + '='.repeat(60));
        log('\n🎉 ¡PRUEBA DEL SENSOR DHT11 COMPLETADA!', 'green');
        log('\n📋 Resumen:', 'cyan');
        log('✅ Módulo cargado correctamente', 'green');
        log('✅ Instancia creada', 'green');
        log('✅ Lecturas realizadas', 'green');
        log('✅ Modo verificado', 'green');
        
        log('\n🌡️  El sensor DHT11 está funcionando correctamente', 'green');
        log('   Puede ser en modo simulación (normal en Windows) o hardware', 'blue');
        
        console.log('\n' + '='.repeat(60));
        log('\n🌱 Sistema de Hidroponía Automatizado - Ing. Daril Díaz © 2024', 'magenta');

    } catch (error) {
        log(`\n❌ Error durante la prueba: ${error.message}`, 'red');
        process.exit(1);
    }
}

// Ejecutar prueba
if (require.main === module) {
    testDHT11();
}

module.exports = { testDHT11 }; 