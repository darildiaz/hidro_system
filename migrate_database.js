#!/usr/bin/env node

/**
 * Script de Migración de Base de Datos
 * Sistema de Hidroponía Automatizado - Ing. Daril Díaz
 * 
 * Este script migra la base de datos existente a la nueva estructura
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Configuración
const DB_PATH = path.join(__dirname, 'data', 'hidro_system.db');
const BACKUP_PATH = path.join(__dirname, 'data', 'hidro_system_backup.db');

console.log('🔄 Iniciando migración de base de datos...');

// Verificar si existe la base de datos
if (!fs.existsSync(DB_PATH)) {
    console.log('❌ No se encontró la base de datos. Creando nueva...');
    process.exit(0);
}

// Crear backup
console.log('💾 Creando backup de la base de datos...');
try {
    fs.copyFileSync(DB_PATH, BACKUP_PATH);
    console.log('✅ Backup creado en:', BACKUP_PATH);
} catch (error) {
    console.error('❌ Error creando backup:', error.message);
    process.exit(1);
}

// Conectar a la base de datos
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Error conectando a la base de datos:', err.message);
        process.exit(1);
    }
    console.log('✅ Conectado a la base de datos');
});

// Función para ejecutar consultas SQL
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

// Función para verificar si existe una tabla
function tableExists(tableName) {
    return new Promise((resolve) => {
        db.get(
            "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
            [tableName],
            (err, row) => {
                resolve(!!row);
            }
        );
    });
}

// Función para verificar columnas de una tabla
function getTableInfo(tableName) {
    return new Promise((resolve, reject) => {
        db.all(`PRAGMA table_info(${tableName})`, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// Función principal de migración
async function migrateDatabase() {
    try {
        console.log('🔍 Analizando estructura actual de la base de datos...');
        
        // Verificar tablas existentes
        const tables = await getQuery("SELECT name FROM sqlite_master WHERE type='table'");
        console.log('📋 Tablas encontradas:', tables.map(t => t.name));
        
        // Migrar tabla schedules si es necesario
        if (await tableExists('schedules')) {
            console.log('🔄 Migrando tabla schedules...');
            const columns = await getTableInfo('schedules');
            const hasOldStructure = columns.some(col => 
                col.name === 'rele_id' || col.name === 'day_of_week' || col.name === 'start_time'
            );
            
            if (hasOldStructure) {
                console.log('📝 Estructura antigua detectada, migrando...');
                
                // Crear tabla temporal con nueva estructura
                await runQuery(`
                    CREATE TABLE schedules_new (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        releId INTEGER NOT NULL,
                        time TEXT NOT NULL,
                        duration INTEGER NOT NULL,
                        days TEXT NOT NULL,
                        enabled INTEGER DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                
                // Migrar datos existentes
                const oldSchedules = await getQuery('SELECT * FROM schedules');
                for (const schedule of oldSchedules) {
                    if (schedule.is_active) {
                        await runQuery(`
                            INSERT INTO schedules_new (releId, time, duration, days, enabled)
                            VALUES (?, ?, ?, ?, ?)
                        `, [
                            schedule.rele_id || 1,
                            schedule.start_time || '00:00',
                            schedule.duration || 15,
                            schedule.day_of_week || '1,2,3,4,5,6,7',
                            1
                        ]);
                    }
                }
                
                // Reemplazar tabla
                await runQuery('DROP TABLE schedules');
                await runQuery('ALTER TABLE schedules_new RENAME TO schedules');
                console.log('✅ Tabla schedules migrada correctamente');
            } else {
                console.log('✅ Tabla schedules ya tiene la estructura correcta');
            }
        }
        
        // Migrar tabla conditions si es necesario
        if (await tableExists('conditions')) {
            console.log('🔄 Migrando tabla conditions...');
            const columns = await getTableInfo('conditions');
            const hasOldStructure = columns.some(col => 
                col.name === 'rele_id' || col.name === 'threshold_value' || col.name === 'operator'
            );
            
            if (hasOldStructure) {
                console.log('📝 Estructura antigua detectada, migrando...');
                
                // Crear tabla temporal con nueva estructura
                await runQuery(`
                    CREATE TABLE conditions_new (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        releId INTEGER NOT NULL,
                        condition_type TEXT NOT NULL,
                        value REAL NOT NULL,
                        duration INTEGER DEFAULT 15,
                        enabled INTEGER DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                
                // Migrar datos existentes
                const oldConditions = await getQuery('SELECT * FROM conditions');
                for (const condition of oldConditions) {
                    if (condition.is_active) {
                        await runQuery(`
                            INSERT INTO conditions_new (releId, condition_type, value, duration, enabled)
                            VALUES (?, ?, ?, ?, ?)
                        `, [
                            condition.rele_id || 1,
                            condition.condition_type || 'temperature',
                            condition.threshold_value || 25.0,
                            condition.duration || 15,
                            1
                        ]);
                    }
                }
                
                // Reemplazar tabla
                await runQuery('DROP TABLE conditions');
                await runQuery('ALTER TABLE conditions_new RENAME TO conditions');
                console.log('✅ Tabla conditions migrada correctamente');
            } else {
                console.log('✅ Tabla conditions ya tiene la estructura correcta');
            }
        }
        
        // Migrar tabla rele_states si es necesario
        if (await tableExists('rele_states')) {
            console.log('🔄 Migrando tabla rele_states...');
            const columns = await getTableInfo('rele_states');
            const hasOldStructure = columns.some(col => col.name === 'rele_id');
            
            if (hasOldStructure) {
                console.log('📝 Estructura antigua detectada, migrando...');
                
                // Crear tabla temporal con nueva estructura
                await runQuery(`
                    CREATE TABLE rele_states_new (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        releId INTEGER NOT NULL,
                        state BOOLEAN NOT NULL,
                        reason TEXT,
                        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);
                
                // Migrar datos existentes
                const oldStates = await getQuery('SELECT * FROM rele_states');
                for (const state of oldStates) {
                    await runQuery(`
                        INSERT INTO rele_states_new (releId, state, reason, timestamp)
                        VALUES (?, ?, ?, ?)
                    `, [
                        state.rele_id || 1,
                        state.state || 0,
                        state.reason || 'Migración automática',
                        state.timestamp || new Date().toISOString()
                    ]);
                }
                
                // Reemplazar tabla
                await runQuery('DROP TABLE rele_states');
                await runQuery('ALTER TABLE rele_states_new RENAME TO rele_states');
                console.log('✅ Tabla rele_states migrada correctamente');
            } else {
                console.log('✅ Tabla rele_states ya tiene la estructura correcta');
            }
        }
        
        console.log('🎉 Migración completada exitosamente!');
        
    } catch (error) {
        console.error('❌ Error durante la migración:', error.message);
        console.log('🔄 Restaurando backup...');
        
        try {
            fs.copyFileSync(BACKUP_PATH, DB_PATH);
            console.log('✅ Backup restaurado');
        } catch (restoreError) {
            console.error('❌ Error restaurando backup:', restoreError.message);
        }
        
        process.exit(1);
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

// Ejecutar migración
migrateDatabase(); 