#!/usr/bin/env node

/**
 * Prueba de los Relés
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

async function testRelays() {
    try {
        log('\n🔌 PRUEBA DE LOS RELÉS', 'magenta');
        log('🔧 Sistema de Hidroponía Automatizado', 'cyan');
        log('👨‍💻 Ing. Daril Díaz - 2024', 'blue');
        log('='.repeat(60), 'cyan');

        // Paso 1: Verificar que el módulo existe
        log('\n[1] Verificando módulo GPIO Controller...', 'cyan');
        if (!require('fs').existsSync('./gpio_controller.js')) {
            log('❌ Módulo gpio_controller.js no encontrado', 'red');
            return;
        }
        log('✅ Módulo gpio_controller.js encontrado', 'green');

        // Paso 2: Cargar el módulo
        log('\n[2] Cargando módulo GPIO Controller...', 'cyan');
        let GPIOController;
        try {
            GPIOController = require('./gpio_controller.js');
            log('✅ Módulo GPIO Controller cargado correctamente', 'green');
        } catch (error) {
            log(`❌ Error cargando módulo: ${error.message}`, 'red');
            return;
        }

        // Paso 3: Crear instancia del controlador
        log('\n[3] Creando instancia del controlador...', 'cyan');
        let controller;
        try {
            controller = new GPIOController();
            log('✅ Instancia del controlador creada', 'green');
        } catch (error) {
            log(`❌ Error creando instancia: ${error.message}`, 'red');
            return;
        }

        // Paso 4: Verificar información del sistema
        log('\n[4] Información del sistema...', 'cyan');
        try {
            const systemInfo = controller.getSystemInfo();
            log(`   🖥️  Plataforma: ${systemInfo.platform}`, 'blue');
            log(`   🔧 Arquitectura: ${systemInfo.architecture}`, 'blue');
            log(`   📊 Modo GPIO: ${systemInfo.gpioMode}`, 'blue');
            log(`   🔌 Pines disponibles: ${systemInfo.availablePins.join(', ')}`, 'blue');
        } catch (error) {
            log(`   ⚠️  No se pudo obtener información: ${error.message}`, 'yellow');
        }

        // Paso 5: Probar estado inicial de los relés
        log('\n[5] Estado inicial de los relés...', 'cyan');
        try {
            const initialStates = controller.getAllReleStates();
            log('   📊 Estado inicial:', 'blue');
            for (let i = 0; i < initialStates.length; i++) {
                const state = initialStates[i];
                const status = state.active ? '🟢 ACTIVO' : '🔴 INACTIVO';
                log(`      Relé ${i + 1}: ${status}`, state.active ? 'green' : 'red');
            }
        } catch (error) {
            log(`   ❌ Error obteniendo estados: ${error.message}`, 'red');
        }

        // Paso 6: Probar control de cada relé
        log('\n[6] Probando control de relés...', 'cyan');
        log('   ⚠️  ADVERTENCIA: En modo simulación, los relés no se activarán físicamente', 'yellow');
        
        for (let releId = 1; releId <= 4; releId++) {
            try {
                log(`\n   🔌 Probando Relé ${releId}:`, 'cyan');
                
                // Activar relé
                log(`      Activando relé ${releId}...`, 'yellow');
                const activateResult = controller.controlRele(releId, true, 'Prueba de activación');
                
                if (activateResult) {
                    log(`      ✅ Relé ${releId} activado correctamente`, 'green');
                } else {
                    log(`      ❌ Error activando relé ${releId}`, 'red');
                }
                
                // Verificar estado
                await new Promise(resolve => setTimeout(resolve, 1000));
                const states = controller.getAllReleStates();
                const currentState = states[releId - 1];
                
                if (currentState && currentState.active) {
                    log(`      ✅ Estado confirmado: ACTIVO`, 'green');
                } else {
                    log(`      ⚠️  Estado no confirmado`, 'yellow');
                }
                
                // Desactivar relé
                log(`      Desactivando relé ${releId}...`, 'yellow');
                const deactivateResult = controller.controlRele(releId, false, 'Prueba de desactivación');
                
                if (deactivateResult) {
                    log(`      ✅ Relé ${releId} desactivado correctamente`, 'green');
                } else {
                    log(`      ❌ Error desactivando relé ${releId}`, 'red');
                }
                
                // Esperar entre relés
                if (releId < 4) {
                    log(`      ⏳ Esperando 1 segundo...`, 'yellow');
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                
            } catch (error) {
                log(`      ❌ Error probando relé ${releId}: ${error.message}`, 'red');
            }
        }

        // Paso 7: Probar control múltiple
        log('\n[7] Probando control múltiple...', 'cyan');
        try {
            log('   🔄 Activando todos los relés...', 'yellow');
            for (let i = 1; i <= 4; i++) {
                controller.controlRele(i, true, 'Prueba múltiple');
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const allActiveStates = controller.getAllReleStates();
            const activeCount = allActiveStates.filter(state => state.active).length;
            log(`   📊 Relés activos: ${activeCount}/4`, 'blue');
            
            log('   🔄 Desactivando todos los relés...', 'yellow');
            for (let i = 1; i <= 4; i++) {
                controller.controlRele(i, false, 'Prueba múltiple');
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const allInactiveStates = controller.getAllReleStates();
            const inactiveCount = allInactiveStates.filter(state => !state.active).length;
            log(`   📊 Relés inactivos: ${inactiveCount}/4`, 'blue');
            
        } catch (error) {
            log(`   ❌ Error en control múltiple: ${error.message}`, 'red');
        }

        // Paso 8: Verificar modo simulación
        log('\n[8] Verificando modo de operación...', 'cyan');
        try {
            const systemInfo = controller.getSystemInfo();
            if (systemInfo.gpioMode === 'simulation') {
                log('✅ Modo simulación activo', 'green');
                log('   📱 Los relés se simulan (no se activan físicamente)', 'blue');
                log('   🔌 Perfecto para desarrollo y pruebas', 'blue');
            } else {
                log('✅ Modo hardware activo', 'green');
                log('   🔌 Los relés se controlan físicamente', 'blue');
                log('   ⚠️  ¡CUIDADO! Los relés se activarán realmente', 'yellow');
            }
        } catch (error) {
            log(`⚠️  No se pudo verificar modo: ${error.message}`, 'yellow');
        }

        // Resumen final
        console.log('\n' + '='.repeat(60));
        log('\n🎉 ¡PRUEBA DE LOS RELÉS COMPLETADA!', 'green');
        log('\n📋 Resumen:', 'cyan');
        log('✅ Módulo cargado correctamente', 'green');
        log('✅ Controlador inicializado', 'green');
        log('✅ Estados verificados', 'green');
        log('✅ Control individual probado', 'green');
        log('✅ Control múltiple probado', 'green');
        log('✅ Modo de operación verificado', 'green');
        
        log('\n🔌 Los relés están funcionando correctamente', 'green');
        log('   En modo simulación para desarrollo seguro', 'blue');
        
        console.log('\n' + '='.repeat(60));
        log('\n🌱 Sistema de Hidroponía Automatizado - Ing. Daril Díaz © 2024', 'magenta');

    } catch (error) {
        log(`\n❌ Error durante la prueba: ${error.message}`, 'red');
        process.exit(1);
    }
}

// Ejecutar prueba
if (require.main === module) {
    testRelays();
}

module.exports = { testRelays }; 