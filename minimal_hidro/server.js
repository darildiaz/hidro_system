#!/usr/bin/env node

/**
 * Servidor Minimalista de Control de Hidroponía
 * Solo relés y temperatura - Sin complicaciones
 */

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001; // Puerto diferente para no conflictos

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', 'views');

// Base de datos simple
const db = new sqlite3.Database('minimal_hidro.db');

// Inicializar base de datos
db.serialize(() => {
    // Tabla de lecturas de temperatura
    db.run(`
        CREATE TABLE IF NOT EXISTS temperature_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            temperature REAL NOT NULL,
            humidity REAL NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Tabla de estado de relés
    db.run(`
        CREATE TABLE IF NOT EXISTS relay_states (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            relay_id INTEGER NOT NULL,
            state INTEGER NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Insertar estado inicial de relés
    for (let i = 1; i <= 4; i++) {
        db.run(`
            INSERT OR IGNORE INTO relay_states (relay_id, state) 
            VALUES (?, 0)
        `, [i]);
    }
    
    console.log('✅ Base de datos inicializada');
});

// ===== RUTAS =====

// Página principal
app.get('/', (req, res) => {
    res.render('index');
});

// API: Obtener temperatura actual
app.get('/api/temperature', (req, res) => {
    // Simular lectura de sensor (en producción sería real)
    const temperature = 25 + Math.random() * 10; // 25-35°C
    const humidity = 60 + Math.random() * 20;    // 60-80%
    
    // Guardar en base de datos
    db.run(`
        INSERT INTO temperature_readings (temperature, humidity) 
        VALUES (?, ?)
    `, [temperature, humidity]);
    
    res.json({
        success: true,
        data: {
            temperature: Math.round(temperature * 10) / 10,
            humidity: Math.round(humidity * 10) / 10,
            timestamp: new Date().toISOString()
        }
    });
});

// API: Obtener estado de relés
app.get('/api/relays', (req, res) => {
    db.all(`
        SELECT relay_id, state, timestamp 
        FROM relay_states 
        ORDER BY relay_id
    `, (err, rows) => {
        if (err) {
            res.json({ success: false, error: err.message });
        } else {
            res.json({ success: true, data: rows });
        }
    });
});

// API: Controlar relé
app.post('/api/relay/:id/:action', (req, res) => {
    const relayId = parseInt(req.params.id);
    const action = req.params.action;
    
    if (relayId < 1 || relayId > 4) {
        return res.json({ success: false, error: 'Relé inválido' });
    }
    
    if (!['on', 'off'].includes(action)) {
        return res.json({ success: false, error: 'Acción inválida' });
    }
    
    const state = action === 'on' ? 1 : 0;
    
    // Actualizar estado en base de datos
    db.run(`
        UPDATE relay_states 
        SET state = ?, timestamp = CURRENT_TIMESTAMP 
        WHERE relay_id = ?
    `, [state, relayId], function(err) {
        if (err) {
            res.json({ success: false, error: err.message });
        } else {
            // Insertar nuevo registro de estado
            db.run(`
                INSERT INTO relay_states (relay_id, state) 
                VALUES (?, ?)
            `, [relayId, state]);
            
            res.json({ 
                success: true, 
                message: `Relé ${relayId} ${action === 'on' ? 'activado' : 'desactivado'}`,
                data: { relayId, state }
            });
        }
    });
});

// API: Obtener historial de temperatura
app.get('/api/temperature/history', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    
    db.all(`
        SELECT temperature, humidity, timestamp 
        FROM temperature_readings 
        ORDER BY timestamp DESC 
        LIMIT ?
    `, [limit], (err, rows) => {
        if (err) {
            res.json({ success: false, error: err.message });
        } else {
            res.json({ success: true, data: rows.reverse() });
        }
    });
});

// ===== INICIAR SERVIDOR =====

app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 Servidor minimalista iniciado');
    console.log(`🌐 URL: http://localhost:${PORT}`);
    console.log(`🌐 URL LAN: http://192.168.1.39:${PORT}`);
    console.log('📱 Control de 4 relés + sensor de temperatura');
    console.log('✅ Sin complicaciones, solo funcionalidad básica');
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
    console.log('\n🔄 Cerrando servidor...');
    db.close();
    process.exit(0);
}); 