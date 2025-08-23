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
        rele_id INTEGER NOT NULL,
        day_of_week INTEGER NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        duration INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabla de condiciones de activación
      `CREATE TABLE IF NOT EXISTS conditions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rele_id INTEGER NOT NULL,
        condition_type TEXT NOT NULL,
        threshold_value REAL NOT NULL,
        operator TEXT NOT NULL,
        action TEXT NOT NULL,
        duration INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabla de estado de relés
      `CREATE TABLE IF NOT EXISTS rele_states (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rele_id INTEGER NOT NULL,
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
        `INSERT INTO schedules (rele_id, day_of_week, start_time, end_time, duration, is_active) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [schedule.rele_id, schedule.day_of_week, schedule.start_time, 
         schedule.end_time, schedule.duration, schedule.is_active],
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
        'SELECT * FROM schedules WHERE is_active = 1 ORDER BY day_of_week, start_time',
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
        `INSERT INTO conditions (rele_id, condition_type, threshold_value, operator, action, duration, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [condition.rele_id, condition.condition_type, condition.threshold_value,
         condition.operator, condition.action, condition.duration, condition.is_active],
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
        'SELECT * FROM conditions WHERE is_active = 1',
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
        'INSERT INTO rele_states (rele_id, state, reason) VALUES (?, ?, ?)',
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
        'SELECT * FROM rele_states WHERE rele_id = ? ORDER BY timestamp DESC LIMIT 1',
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