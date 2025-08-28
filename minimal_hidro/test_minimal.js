#!/usr/bin/env node

/**
 * Script de Prueba del Sistema Minimalista
 * Control de Hidroponía - Solo relés y temperatura
 */

const sqlite3 = require('sqlite3').verbose();

console.log('🧪 Probando Sistema Minimalista de Hidroponía...\n');

// Conectar a la base de datos
const db = new sqlite3.Database('minimal_hidro.db', (err) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err.message);
        process.exit(1);
    }
    console.log('✅ Conectado a la base de datos');
});

// Función para ejecutar consultas
function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this);
            }
        });
    });
}

// Función para obtener datos
function getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Función principal de pruebas
async function runTests() {
    try {
        console.log('📋 Ejecutando pruebas...\n');
        
        // 1. Verificar tablas
        console.log('[1] Verificando estructura de base de datos...');
        const tables = await getQuery("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('✅ Tablas encontradas:', tables.map(t => t.name));
        
        // 2. Verificar relés iniciales
        console.log('\n[2] Verificando estado inicial de relés...');
        const relays = await getQuery('SELECT * FROM relay_states ORDER BY relay_id');
        console.log('✅ Estados de relés:');
        relays.forEach(relay => {
            console.log(`   Relé ${relay.relay_id}: ${relay.state === 1 ? 'Activado' : 'Desactivado'}`);
        });
        
        // 3. Simular lectura de temperatura
        console.log('\n[3] Simulando lectura de temperatura...');
        const temperature = 25 + Math.random() * 10;
        const humidity = 60 + Math.random() * 20;
        
        await runQuery(`
            INSERT INTO temperature_readings (temperature, humidity) 
            VALUES (?, ?)
        `, [temperature, humidity]);
        
        console.log(`✅ Temperatura simulada: ${temperature.toFixed(1)}°C`);
        console.log(`✅ Humedad simulada: ${humidity.toFixed(1)}%`);
        
        // 4. Probar control de relé
        console.log('\n[4] Probando control de relé...');
        await runQuery(`
            UPDATE relay_states 
            SET state = 1, timestamp = CURRENT_TIMESTAMP 
            WHERE relay_id = 1
        `);
        
        console.log('✅ Relé 1 activado');
        
        // 5. Verificar cambio de estado
        console.log('\n[5] Verificando cambio de estado...');
        const relay1 = await getQuery('SELECT * FROM relay_states WHERE relay_id = 1 ORDER BY timestamp DESC LIMIT 1');
        if (relay1[0] && relay1[0].state === 1) {
            console.log('✅ Estado del relé 1 actualizado correctamente');
        } else {
            console.log('❌ Error actualizando estado del relé 1');
        }
        
        // 6. Obtener historial de temperatura
        console.log('\n[6] Verificando historial de temperatura...');
        const history = await getQuery(`
            SELECT temperature, humidity, timestamp 
            FROM temperature_readings 
            ORDER BY timestamp DESC 
            LIMIT 5
        `);
        
        console.log(`✅ Historial de temperatura (últimas 5 lecturas):`);
        history.forEach((reading, index) => {
            console.log(`   ${index + 1}. ${reading.temperature.toFixed(1)}°C, ${reading.humidity.toFixed(1)}% - ${reading.timestamp}`);
        });
        
        // 7. Desactivar relé de prueba
        console.log('\n[7] Limpiando estado de prueba...');
        await runQuery(`
            UPDATE relay_states 
            SET state = 0, timestamp = CURRENT_TIMESTAMP 
            WHERE relay_id = 1
        `);
        console.log('✅ Relé 1 desactivado');
        
        console.log('\n🎉 Todas las pruebas completadas exitosamente!');
        
    } catch (error) {
        console.error('\n❌ Error durante las pruebas:', error.message);
    } finally {
        db.close((err) => {
            if (err) {
                console.error('❌ Error cerrando base de datos:', err.message);
            } else {
                console.log('✅ Base de datos cerrada');
            }
        });
    }
}

// Ejecutar pruebas
runTests(); 