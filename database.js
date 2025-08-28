/**
 * Módulo de Base de Datos SQLite
 * Sistema de Hidroponía Automatizado
 * Ing. Daril Díaz - 2024
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const config = require('./config');

class Database {
  constructor() {
    this.dbPath = config.database.path;
    this.db = null;
    this.init();
  }

  /**
   * Inicializar la base de datos
   */
  init() {
    try {
      // Crear directorio de datos si no existe
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Conectar a la base de datos
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error conectando a la base de datos:', err.message);
        } else {
          console.log('Conectado a la base de datos SQLite');
          this.createTables();
        }
      });
    } catch (error) {
      console.error('Error inicializando base de datos:', error);
    }
  }

  /**
   * Crear tablas de la base de datos
   */
  createTables() {
    const tables = [
      // Tabla de lecturas de sensores
      `CREATE TABLE IF NOT EXISTS sensor_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        temperature REAL NOT NULL,
        humidity REAL NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabla de horarios programados
      `CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        releId INTEGER NOT NULL,
        time TEXT NOT NULL,
        duration INTEGER NOT NULL,
        days TEXT NOT NULL,
        enabled INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabla de condiciones para activación automática
      `CREATE TABLE IF NOT EXISTS conditions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        releId INTEGER NOT NULL,
        condition_type TEXT NOT NULL,
        value REAL NOT NULL,
        duration INTEGER DEFAULT 15,
        enabled INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabla de estado de relés
      `CREATE TABLE IF NOT EXISTS rele_states (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        releId INTEGER NOT NULL,
        state BOOLEAN NOT NULL,
        reason TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabla de logs del sistema
      `CREATE TABLE IF NOT EXISTS system_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        source TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabla de configuraciones del sistema
      `CREATE TABLE IF NOT EXISTS system_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        description TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    tables.forEach(table => {
      this.db.run(table, (err) => {
        if (err) {
          console.error('Error creando tabla:', err.message);
        }
      });
    });

    // Insertar configuraciones por defecto
    this.insertDefaultConfig();
  }

  /**
   * Insertar configuraciones por defecto
   */
  insertDefaultConfig() {
    const defaultConfig = [
      ['system_name', 'Sistema de Hidroponía Automatizado', 'Nombre del sistema'],
      ['version', '1.0.0', 'Versión del sistema'],
      ['dht11_interval', '60000', 'Intervalo de lectura DHT11 (ms)'],
      ['condition_check_interval', '60000', 'Intervalo de verificación de condiciones (ms)'],
      ['backup_enabled', 'true', 'Respaldo automático habilitado'],
      ['backup_frequency', '24', 'Frecuencia de respaldo (horas)']
    ];

    defaultConfig.forEach(([key, value, description]) => {
      this.db.run(
        'INSERT OR IGNORE INTO system_config (key, value, description) VALUES (?, ?, ?)',
        [key, value, description]
      );
    });
  }

  /**
   * Guardar lectura de sensor
   */
  saveSensorReading(temperature, humidity) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO sensor_readings (temperature, humidity) VALUES (?, ?)',
        [temperature, humidity],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
  }

  /**
   * Obtener últimas lecturas de sensores
   */
  getRecentSensorReadings(limit = 100) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM sensor_readings ORDER BY timestamp DESC LIMIT ?',
        [limit],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  /**
   * Obtener lecturas de sensores por rango de fechas
   */
  getSensorReadingsByDateRange(startDate, endDate) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM sensor_readings WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp ASC',
        [startDate, endDate],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  /**
   * Guardar horario programado
   */
  saveSchedule(schedule) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO schedules (releId, time, duration, days, enabled) 
         VALUES (?, ?, ?, ?, ?)`,
        [schedule.releId, schedule.time, schedule.duration, schedule.days, schedule.enabled],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
  }

  /**
   * Obtener horarios activos
   */
  getActiveSchedules() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM schedules WHERE enabled = 1 ORDER BY days, time',
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  /**
   * Guardar condición de activación
   */
  saveCondition(condition) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT INTO conditions (releId, condition_type, value, duration, enabled) 
         VALUES (?, ?, ?, ?, ?)`,
        [condition.releId, condition.condition_type, condition.value,
         condition.duration, condition.enabled],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
  }

  /**
   * Obtener condiciones activas
   */
  getActiveConditions() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM conditions WHERE enabled = 1',
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  /**
   * Guardar estado de relé
   */
  saveReleState(releId, state, reason = null) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO rele_states (releId, state, reason) VALUES (?, ?, ?)',
        [releId, state, reason],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
  }

  /**
   * Obtener último estado de un relé
   */
  getLastReleState(releId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM rele_states WHERE releId = ? ORDER BY timestamp DESC LIMIT 1',
        [releId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  /**
   * Guardar log del sistema
   */
  saveSystemLog(level, message, source = null) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO system_logs (level, message, source) VALUES (?, ?, ?)',
        [level, message, source],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.lastID);
          }
        }
      );
    });
  }

  /**
   * Obtener logs del sistema
   */
  getSystemLogs(limit = 100, level = null) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM system_logs';
      let params = [];

      if (level) {
        query += ' WHERE level = ?';
        params.push(level);
      }

      query += ' ORDER BY timestamp DESC LIMIT ?';
      params.push(limit);

      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Actualizar configuración del sistema
   */
  updateSystemConfig(key, value) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE system_config SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
        [value, key],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes);
          }
        }
      );
    });
  }

  /**
   * Obtener configuración del sistema
   */
  getSystemConfig(key) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM system_config WHERE key = ?',
        [key],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  /**
   * Crear respaldo de la base de datos
   */
  createBackup() {
    return new Promise((resolve, reject) => {
      const backupDir = config.database.backupPath;
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `backup_${timestamp}.db`);

      this.db.backup(backupPath, (err) => {
        if (err) {
          reject(err);
        } else {
          // Limpiar respaldos antiguos
          this.cleanOldBackups();
          resolve(backupPath);
        }
      });
    });
  }

  /**
   * Limpiar respaldos antiguos
   */
  cleanOldBackups() {
    const backupDir = config.database.backupPath;
    if (!fs.existsSync(backupDir)) return;

    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.db'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        time: fs.statSync(path.join(backupDir, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    // Mantener solo los últimos respaldos según configuración
    if (files.length > config.database.maxBackups) {
      files.slice(config.database.maxBackups).forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (error) {
          console.error('Error eliminando respaldo:', error);
        }
      });
    }
  }

  // Métodos para el Programador
  async getSchedules() {
      try {
          const schedules = await this.db.all(`
              SELECT releId, time, duration, days, enabled, created_at 
              FROM schedules 
              ORDER BY releId, time
          `);
          
          // Agrupar por relé
          const groupedSchedules = { 1: [], 2: [], 3: [], 4: [] };
          schedules.forEach(schedule => {
              if (groupedSchedules[schedule.releId]) {
                  groupedSchedules[schedule.releId].push({
                      time: schedule.time,
                      duration: schedule.duration,
                      days: JSON.parse(schedule.days || '[]'),
                      enabled: schedule.enabled === 1
                  });
              }
          });
          
          return groupedSchedules;
      } catch (error) {
          console.error('Error obteniendo horarios:', error);
          return { 1: [], 2: [], 3: [], 4: [] };
      }
  }

  async saveSchedules(schedules) {
      try {
          // Limpiar horarios existentes
          await this.db.run('DELETE FROM schedules');
          
          // Insertar nuevos horarios
          for (let releId = 1; releId <= 4; releId++) {
              if (schedules[releId] && Array.isArray(schedules[releId])) {
                  for (const schedule of schedules[releId]) {
                      await this.db.run(`
                          INSERT INTO schedules (releId, time, duration, days, enabled, created_at)
                          VALUES (?, ?, ?, ?, ?, datetime('now'))
                      `, [
                          releId,
                          schedule.time,
                          schedule.duration,
                          JSON.stringify(schedule.days || []),
                          schedule.enabled ? 1 : 0
                      ]);
                  }
              }
          }
          
          return true;
      } catch (error) {
          console.error('Error guardando horarios:', error);
          throw error;
      }
  }

  async getConditions() {
      try {
          const conditions = await this.db.all(`
              SELECT releId, condition_type, value, duration, enabled
              FROM conditions 
              ORDER BY releId, condition_type
          `);
          
          // Agrupar por relé
          const groupedConditions = { 1: {}, 2: {}, 3: {}, 4: {} };
          conditions.forEach(condition => {
              if (groupedConditions[condition.releId]) {
                  groupedConditions[condition.releId][condition.condition_type] = {
                      value: condition.value,
                      duration: condition.duration,
                      enabled: condition.enabled === 1
                  };
              }
          });
          
          return groupedConditions;
      } catch (error) {
          console.error('Error obteniendo condiciones:', error);
          return { 1: {}, 2: {}, 3: {}, 4: {} };
      }
  }

  async saveConditions(conditions) {
      try {
          // Limpiar condiciones existentes
          await this.db.run('DELETE FROM conditions');
          
          // Insertar nuevas condiciones
          for (let releId = 1; releId <= 4; releId++) {
              if (conditions[releId]) {
                  const releConditions = conditions[releId];
                  
                  // Relé 1 - Temperatura máxima
                  if (releConditions.tempMax !== undefined) {
                      await this.db.run(`
                          INSERT INTO conditions (releId, condition_type, value, duration, enabled, created_at)
                          VALUES (?, 'tempMax', ?, ?, 1, datetime('now'))
                      `, [releId, releConditions.tempMax, releConditions.tempTime || 30]);
                  }
                  
                  // Relé 2 - Humedad mínima
                  if (releConditions.humidityMin !== undefined) {
                      await this.db.run(`
                          INSERT INTO conditions (releId, condition_type, value, duration, enabled, created_at)
                          VALUES (?, 'humidityMin', ?, ?, 1, datetime('now'))
                      `, [releId, releConditions.humidityMin, releConditions.humidityTime || 15]);
                  }
                  
                  // Relé 3 - Temperatura y humedad máxima
                  if (releConditions.tempMax !== undefined) {
                      await this.db.run(`
                          INSERT INTO conditions (releId, condition_type, value, duration, enabled, created_at)
                          VALUES (?, 'tempMax', ?, 15, 1, datetime('now'))
                      `, [releId, releConditions.tempMax]);
                  }
                  if (releConditions.humidityMax !== undefined) {
                      await this.db.run(`
                          INSERT INTO conditions (releId, condition_type, value, duration, enabled, created_at)
                          VALUES (?, 'humidityMax', ?, 15, 1, datetime('now'))
                      `, [releId, releConditions.humidityMax]);
                  }
                  
                  // Relé 4 - Temperatura mínima
                  if (releConditions.tempMin !== undefined) {
                      await this.db.run(`
                          INSERT INTO conditions (releId, condition_type, value, duration, enabled, created_at)
                          VALUES (?, 'tempMin', ?, ?, 1, datetime('now'))
                      `, [releId, releConditions.tempMin, releConditions.tempTime || 30]);
                  }
              }
          }
          
          return true;
      } catch (error) {
          console.error('Error guardando condiciones:', error);
          throw error;
      }
  }

  /**
   * Cerrar conexión a la base de datos
   */
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error cerrando base de datos:', err.message);
        } else {
          console.log('Conexión a base de datos cerrada');
        }
      });
    }
  }
}

module.exports = Database; 