#!/usr/bin/env node

/**
 * Aplicación Principal - Modo Desarrollo
 * Sistema de Hidroponía Automatizado
 * Configuración de seguridad relajada para desarrollo
 * Ing. Daril Díaz - 2024
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const bodyParser = require('body-parser');

// Importar módulos del sistema
const Database = require('./database');
const GPIOController = require('./gpio_controller');
const Scheduler = require('./scheduler');

// Usar configuración de desarrollo
const config = require('./config.development');

// Crear aplicación Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Configurar middleware de seguridad RELAJADO para desarrollo
app.use(helmet({
  contentSecurityPolicy: false, // Deshabilitar CSP estricto
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false
}));

// Configurar middleware
app.use(compression());
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
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
    console.log('🌱 Inicializando Sistema de Hidroponía Automatizado (MODO DESARROLLO)...');
    
    // Inicializar base de datos
    database = new Database();
    console.log('✅ Base de datos inicializada');
    
    // Inicializar controlador GPIO
    gpioController = new GPIOController();
    console.log('✅ Controlador GPIO inicializado');
    
    // Inicializar programador
    scheduler = new Scheduler();
    console.log('✅ Programador de horarios inicializado');
    
    console.log('🚀 Sistema inicializado correctamente (MODO DESARROLLO)');
    
    // Guardar log de inicio
    await database.saveSystemLog('info', 'Sistema iniciado en modo desarrollo', 'Main');
    
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
      title: 'Sistema de Hidroponía Automatizado (DESARROLLO)',
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
      title: 'Programación de Horarios (DESARROLLO)',
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
      title: 'Condiciones de Activación (DESARROLLO)',
      conditions: activeConditions
    });
  } catch (error) {
    console.error('Error renderizando condiciones:', error);
    res.status(500).render('error', { error: 'Error interno del servidor' });
  }
});

app.get('/monitoreo', async (req, res) => {
  try {
    const sensorReadings = await database.getSensorReadings(100);
    const systemLogs = await database.getSystemLogs(50);
    
    res.render('monitoreo', {
      title: 'Monitoreo del Sistema (DESARROLLO)',
      sensorReadings,
      systemLogs
    });
  } catch (error) {
    console.error('Error renderizando monitoreo:', error);
    res.status(500).render('error', { error: 'Error interno del servidor' });
  }
});

app.get('/configuracion', async (req, res) => {
  try {
    const systemConfig = await database.getSystemConfig();
    res.render('configuracion', {
      title: 'Configuración del Sistema (DESARROLLO)',
      config: systemConfig
    });
  } catch (error) {
    console.error('Error renderizando configuración:', error);
    res.status(500).render('error', { error: 'Error interno del servidor' });
  }
});

// API REST para control de relés
app.post('/api/rele/control', async (req, res) => {
  try {
    const { releId, state, reason } = req.body;
    
    if (releId === undefined || state === undefined) {
      return res.status(400).json({ success: false, error: 'Parámetros requeridos: releId, state' });
    }
    
    const success = gpioController.controlRele(releId, state, reason || 'Control manual');
    
    if (success) {
      res.json({ success: true, message: `Relé ${releId} ${state ? 'activado' : 'desactivado'}` });
    } else {
      res.status(500).json({ success: false, error: 'Error controlando relé' });
    }
    
  } catch (error) {
    console.error('Error en API de control de relé:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API para obtener datos de sensores
app.get('/api/sensors/current', async (req, res) => {
  try {
    const sensorData = gpioController.readDHT11();
    res.json({ success: true, data: sensorData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API para obtener estado de relés
app.get('/api/rele/states', async (req, res) => {
  try {
    const releStates = gpioController.getAllReleStates();
    res.json({ success: true, data: releStates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API para programación
app.post('/api/schedule', async (req, res) => {
  try {
    const schedule = req.body;
    const success = await database.saveSchedule(schedule);
    
    if (success) {
      scheduler.addSchedule(schedule);
      res.json({ success: true, message: 'Horario guardado correctamente' });
    } else {
      res.status(500).json({ success: false, error: 'Error guardando horario' });
    }
    
  } catch (error) {
    console.error('Error en API de horarios:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API para condiciones
app.post('/api/condition', async (req, res) => {
  try {
    const condition = req.body;
    const success = await database.saveCondition(condition);
    
    if (success) {
      scheduler.addCondition(condition);
      res.json({ success: true, message: 'Condición guardada correctamente' });
    } else {
      res.status(500).json({ success: false, error: 'Error guardando condición' });
    }
    
  } catch (error) {
    console.error('Error en API de condiciones:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API para logs del sistema
app.get('/api/logs', async (req, res) => {
  try {
    const { level, limit = 100 } = req.query;
    const logs = await database.getSystemLogs(parseInt(limit), level);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API para control del sistema
app.post('/api/system/control', async (req, res) => {
  try {
    const { action } = req.body;
    
    switch (action) {
      case 'backup':
        const backupPath = await database.createBackup();
        res.json({ success: true, message: 'Respaldo creado', path: backupPath });
        break;
        
      case 'restart':
        res.json({ success: true, message: 'Reinicio programado' });
        setTimeout(() => process.exit(0), 1000);
        break;
        
      case 'test_gpio':
        const testResults = gpioController.testSystem();
        res.json({ success: true, testResults });
        break;
        
      default:
        res.status(400).json({ success: false, error: 'Acción no válida' });
    }
    
  } catch (error) {
    console.error('Error en API de control del sistema:', error);
    res.status(500).json({ success: false, error: error.message });
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
  console.log('\n🔄 Cerrando sistema (MODO DESARROLLO)...');
  
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
  const host = config.server.host;
  const port = config.server.port;
  
  server.listen(port, host, () => {
    console.log(`🌐 Servidor web iniciado en http://${host}:${port}`);
    console.log(`📱 Interfaz web disponible en:`);
    console.log(`   - Local: http://localhost:${port}`);
    console.log(`   - Red: http://192.168.1.39:${port}`);
    console.log(`   - Cualquier IP: http://0.0.0.0:${port}`);
    console.log(`🔌 Socket.IO disponible en ws://${host}:${port}`);
    console.log(`⚠️  MODO DESARROLLO - Seguridad relajada para desarrollo`);
    console.log(`🔧 Para acceso desde red local, usa: http://192.168.1.39:${port}`);
  });
}).catch((error) => {
  console.error('❌ Error iniciando servidor:', error);
  process.exit(1);
});

module.exports = app; 