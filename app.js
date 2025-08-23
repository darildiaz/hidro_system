/**
 * Aplicación Principal del Sistema de Hidroponía Automatizado
 * Servidor Express con Socket.IO para control en tiempo real
 * Ing. Daril Díaz - 2024
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');

// Importar módulos del sistema
const config = require('./config');
const Database = require('./database');
const GPIOController = require('./gpio_controller');
const Scheduler = require('./scheduler');

// Crear aplicación Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configurar middleware de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"]
    }
  }
}));

// Configurar middleware
app.use(compression());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configurar motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Inicializar módulos del sistema
let database, gpioController, scheduler;

// Función de inicialización del sistema
async function initializeSystem() {
  try {
    console.log('🌱 Inicializando Sistema de Hidroponía Automatizado...');
    
    // Inicializar base de datos
    database = new Database();
    console.log('✅ Base de datos inicializada');
    
    // Inicializar controlador GPIO
    gpioController = new GPIOController();
    console.log('✅ Controlador GPIO inicializado');
    
    // Inicializar programador
    scheduler = new Scheduler();
    console.log('✅ Programador de horarios inicializado');
    
    console.log('🚀 Sistema inicializado correctamente');
    
    // Guardar log de inicio
    await database.saveSystemLog('info', 'Sistema iniciado correctamente', 'Main');
    
  } catch (error) {
    console.error('❌ Error inicializando sistema:', error);
    process.exit(1);
  }
}

// Rutas de la aplicación
app.get('/', async (req, res) => {
  try {
    const systemInfo = gpioController.getSystemInfo();
    const schedulerStatus = scheduler.getStatus();
    
    // Obtener datos recientes de sensores
    const recentReadings = await database.getRecentSensorReadings(10);
    
    res.render('index', {
      title: 'Sistema de Hidroponía Automatizado',
      systemInfo,
      schedulerStatus,
      recentReadings
    });
  } catch (error) {
    console.error('Error renderizando página principal:', error);
    res.status(500).render('error', { error: 'Error interno del servidor' });
  }
});

app.get('/programacion', async (req, res) => {
  try {
    const activeSchedules = await database.getActiveSchedules();
    res.render('programacion', {
      title: 'Programación de Horarios',
      schedules: activeSchedules
    });
  } catch (error) {
    console.error('Error renderizando programación:', error);
    res.status(500).render('error', { error: 'Error interno del servidor' });
  }
});

app.get('/condiciones', async (req, res) => {
  try {
    const activeConditions = await database.getActiveConditions();
    res.render('condiciones', {
      title: 'Condiciones de Activación',
      conditions: activeConditions
    });
  } catch (error) {
    console.error('Error renderizando condiciones:', error);
    res.status(500).render('error', { error: 'Error interno del servidor' });
  }
});

app.get('/monitoreo', async (req, res) => {
  try {
    const recentReadings = await database.getRecentSensorReadings(100);
    const systemLogs = await database.getSystemLogs(50);
    const releStates = gpioController.getAllReleStates();
    
    res.render('monitoreo', {
      title: 'Monitoreo del Sistema',
      readings: recentReadings,
      logs: systemLogs,
      releStates
    });
  } catch (error) {
    console.error('Error renderizando monitoreo:', error);
    res.status(500).render('error', { error: 'Error interno del servidor' });
  }
});

app.get('/configuracion', async (req, res) => {
  try {
    const systemConfig = await database.getSystemConfig('system_name');
    const gpioInfo = gpioController.getSystemInfo();
    
    res.render('configuracion', {
      title: 'Configuración del Sistema',
      systemConfig,
      gpioInfo
    });
  } catch (error) {
    console.error('Error renderizando configuración:', error);
    res.status(500).render('error', { error: 'Error interno del servidor' });
  }
});

// API para control de relés
app.post('/api/rele/control', async (req, res) => {
  try {
    const { releId, state, reason } = req.body;
    
    if (!releId || typeof state !== 'boolean') {
      return res.status(400).json({ error: 'Parámetros inválidos' });
    }
    
    const success = gpioController.controlRele(releId, state, reason);
    
    if (success) {
      res.json({ success: true, message: `Relé ${releId} ${state ? 'activado' : 'desactivado'}` });
    } else {
      res.status(500).json({ error: 'Error controlando relé' });
    }
    
  } catch (error) {
    console.error('Error en API de control de relé:', error);
    res.status(500).json({ error: error.message });
  }
});

// API para alternar relé
app.post('/api/rele/toggle', async (req, res) => {
  try {
    const { releId } = req.body;
    
    if (!releId) {
      return res.status(400).json({ error: 'ID de relé requerido' });
    }
    
    const success = gpioController.toggleRele(releId);
    
    if (success) {
      const newState = gpioController.getReleState(releId);
      res.json({ success: true, state: newState });
    } else {
      res.status(500).json({ error: 'Error alternando relé' });
    }
    
  } catch (error) {
    console.error('Error en API de alternancia de relé:', error);
    res.status(500).json({ error: error.message });
  }
});

// API para activación temporal
app.post('/api/rele/timed', async (req, res) => {
  try {
    const { releId, duration, reason } = req.body;
    
    if (!releId || !duration) {
      return res.status(400).json({ error: 'Parámetros inválidos' });
    }
    
    gpioController.activateReleTimed(releId, duration, reason);
    
    res.json({ success: true, message: `Relé ${releId} activado por ${duration} segundos` });
    
  } catch (error) {
    console.error('Error en API de activación temporal:', error);
    res.status(500).json({ error: error.message });
  }
});

// API para obtener estado de relés
app.get('/api/rele/status', (req, res) => {
  try {
    const releStates = gpioController.getAllReleStates();
    res.json({ success: true, releStates });
  } catch (error) {
    console.error('Error obteniendo estado de relés:', error);
    res.status(500).json({ error: error.message });
  }
});

// API para obtener datos de sensores
app.get('/api/sensors/current', async (req, res) => {
  try {
    const sensorData = gpioController.readDHT11();
    
    if (sensorData) {
      res.json({ success: true, data: sensorData });
    } else {
      res.status(500).json({ error: 'Error leyendo sensor' });
    }
    
  } catch (error) {
    console.error('Error obteniendo datos de sensores:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sensors/history', async (req, res) => {
  try {
    const { limit = 100, startDate, endDate } = req.query;
    
    let readings;
    if (startDate && endDate) {
      readings = await database.getSensorReadingsByDateRange(startDate, endDate);
    } else {
      readings = await database.getRecentSensorReadings(parseInt(limit));
    }
    
    res.json({ success: true, readings });
    
  } catch (error) {
    console.error('Error obteniendo historial de sensores:', error);
    res.status(500).json({ error: error.message });
  }
});

// API para programación de horarios
app.post('/api/schedule', async (req, res) => {
  try {
    const schedule = req.body;
    
    if (!schedule.rele_id || !schedule.start_time || !schedule.end_time) {
      return res.status(400).json({ error: 'Parámetros incompletos' });
    }
    
    const scheduleId = await database.saveSchedule(schedule);
    
    // Recargar programador
    await scheduler.restart();
    
    res.json({ success: true, scheduleId });
    
  } catch (error) {
    console.error('Error guardando horario:', error);
    res.status(500).json({ error: error.message });
  }
});

// API para condiciones de activación
app.post('/api/condition', async (req, res) => {
  try {
    const condition = req.body;
    
    if (!condition.rele_id || !condition.condition_type || !condition.threshold_value) {
      return res.status(400).json({ error: 'Parámetros incompletos' });
    }
    
    const conditionId = await database.saveCondition(condition);
    
    // Recargar programador
    await scheduler.restart();
    
    res.json({ success: true, conditionId });
    
  } catch (error) {
    console.error('Error guardando condición:', error);
    res.status(500).json({ error: error.message });
  }
});

// API para logs del sistema
app.get('/api/logs', async (req, res) => {
  try {
    const { limit = 100, level } = req.query;
    const logs = await database.getSystemLogs(parseInt(limit), level);
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Error obteniendo logs:', error);
    res.status(500).json({ error: error.message });
  }
});

// API para respaldo manual
app.post('/api/backup', async (req, res) => {
  try {
    const backupPath = await database.createBackup();
    res.json({ success: true, backupPath });
  } catch (error) {
    console.error('Error creando respaldo:', error);
    res.status(500).json({ error: error.message });
  }
});

// API para estado del sistema
app.get('/api/system/status', (req, res) => {
  try {
    const status = {
      gpio: gpioController.getSystemInfo(),
      scheduler: scheduler.getStatus(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
    
    res.json({ success: true, status });
    
  } catch (error) {
    console.error('Error obteniendo estado del sistema:', error);
    res.status(500).json({ error: error.message });
  }
});

// API para control del sistema
app.post('/api/system/control', async (req, res) => {
  try {
    const { action } = req.body;
    
    switch (action) {
      case 'restart_scheduler':
        await scheduler.restart();
        res.json({ success: true, message: 'Programador reiniciado' });
        break;
        
      case 'create_backup':
        const backupPath = await database.createBackup();
        res.json({ success: true, backupPath });
        break;
        
      case 'test_gpio':
        const testResults = gpioController.testGPIOConnections();
        res.json({ success: true, testResults });
        break;
        
      default:
        res.status(400).json({ error: 'Acción no válida' });
    }
    
  } catch (error) {
    console.error('Error en control del sistema:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).render('error', { error: 'Página no encontrada' });
});

// Manejo de errores generales
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  res.status(500).render('error', { error: 'Error interno del servidor' });
});

// Configurar Socket.IO
io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);
  
  // Enviar datos de sensores en tiempo real
  const sensorInterval = setInterval(async () => {
    try {
      const sensorData = gpioController.readDHT11();
      if (sensorData) {
        socket.emit('sensor_data', sensorData);
      }
    } catch (error) {
      console.error('Error enviando datos de sensores:', error);
    }
  }, config.sensors.dht11Interval);
  
  // Enviar estado de relés en tiempo real
  const releInterval = setInterval(() => {
    try {
      const releStates = gpioController.getAllReleStates();
      socket.emit('rele_states', releStates);
    } catch (error) {
      console.error('Error enviando estado de relés:', error);
    }
  }, 5000); // Cada 5 segundos
  
  // Manejar desconexión
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
    clearInterval(sensorInterval);
    clearInterval(releInterval);
  });
  
  // Manejar control de relés desde el cliente
  socket.on('control_rele', async (data) => {
    try {
      const { releId, state, reason } = data;
      const success = gpioController.controlRele(releId, state, reason);
      
      if (success) {
        socket.emit('rele_control_result', { success: true, releId, state });
      } else {
        socket.emit('rele_control_result', { success: false, releId, error: 'Error controlando relé' });
      }
    } catch (error) {
      socket.emit('rele_control_result', { success: false, error: error.message });
    }
  });
});

// Función de limpieza al cerrar
function cleanup() {
  console.log('\n🔄 Cerrando sistema...');
  
  if (scheduler) {
    scheduler.stop();
  }
  
  if (gpioController) {
    gpioController.cleanup();
  }
  
  if (database) {
    database.close();
  }
  
  console.log('✅ Sistema cerrado correctamente');
  process.exit(0);
}

// Manejar señales de terminación
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Inicializar sistema y iniciar servidor
initializeSystem().then(() => {
  server.listen(config.server.port, config.server.host, () => {
    console.log(`🌐 Servidor web iniciado en http://${config.server.host}:${config.server.port}`);
    console.log(`📱 Interfaz web disponible en http://localhost:${config.server.port}`);
    console.log(`🔌 Socket.IO disponible en ws://localhost:${config.server.port}`);
  });
}).catch((error) => {
  console.error('❌ Error iniciando servidor:', error);
  process.exit(1);
});

module.exports = app; 