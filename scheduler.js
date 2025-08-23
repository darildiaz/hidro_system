/**
 * Sistema de Programación Horaria para Hidroponía
 * Control automático de relés por horarios y condiciones
 * Ing. Daril Díaz - 2024
 */

const cron = require('node-cron');
const moment = require('moment');
const config = require('./config');
const Database = require('./database');
const GPIOController = require('./gpio_controller');

class Scheduler {
  constructor() {
    this.database = new Database();
    this.gpioController = new GPIOController();
    this.activeSchedules = new Map();
    this.activeConditions = new Map();
    this.scheduledTasks = new Map();
    this.isRunning = false;
    this.init();
  }

  /**
   * Inicializar el programador
   */
  async init() {
    try {
      // Cargar horarios y condiciones activas
      await this.loadActiveSchedules();
      await this.loadActiveConditions();
      
      // Iniciar tareas programadas
      this.startScheduledTasks();
      
      // Iniciar verificación de condiciones
      this.startConditionChecker();
      
      this.isRunning = true;
      console.log('Programador de horarios inicializado correctamente');
      
      this.database.saveSystemLog('info', 'Programador de horarios inicializado', 'Scheduler');
      
    } catch (error) {
      console.error('Error inicializando programador:', error);
      this.database.saveSystemLog('error', `Error inicializando programador: ${error.message}`, 'Scheduler');
    }
  }

  /**
   * Cargar horarios activos desde la base de datos
   */
  async loadActiveSchedules() {
    try {
      const schedules = await this.database.getActiveSchedules();
      
      schedules.forEach(schedule => {
        this.addSchedule(schedule);
      });
      
      console.log(`${schedules.length} horarios activos cargados`);
      
    } catch (error) {
      console.error('Error cargando horarios:', error);
    }
  }

  /**
   * Cargar condiciones activas desde la base de datos
   */
  async loadActiveConditions() {
    try {
      const conditions = await this.database.getActiveConditions();
      
      conditions.forEach(condition => {
        this.addCondition(condition);
      });
      
      console.log(`${conditions.length} condiciones activas cargadas`);
      
    } catch (error) {
      console.error('Error cargando condiciones:', error);
    }
  }

  /**
   * Agregar horario programado
   */
  addSchedule(schedule) {
    try {
      const scheduleId = `schedule_${schedule.id}`;
      
      // Crear expresión cron para el día de la semana
      const cronExpression = this.createCronExpression(schedule);
      
      // Programar tarea
      const task = cron.schedule(cronExpression, () => {
        this.executeSchedule(schedule);
      }, {
        scheduled: false,
        timezone: config.scheduling.timezone
      });
      
      // Guardar referencia
      this.activeSchedules.set(scheduleId, {
        schedule: schedule,
        task: task,
        cronExpression: cronExpression
      });
      
      // Iniciar tarea
      task.start();
      
      console.log(`Horario ${schedule.id} programado para relé ${schedule.rele_id}`);
      
    } catch (error) {
      console.error(`Error agregando horario ${schedule.id}:`, error);
    }
  }

  /**
   * Crear expresión cron para un horario
   */
  createCronExpression(schedule) {
    // Convertir día de la semana (0-6, donde 0 es domingo)
    const dayOfWeek = schedule.day_of_week;
    
    // Extraer hora y minuto del tiempo de inicio
    const [startHour, startMinute] = schedule.start_time.split(':').map(Number);
    
    // Crear expresión cron: segundo minuto hora día mes día_semana
    return `${startMinute} ${startHour} * * ${dayOfWeek}`;
  }

  /**
   * Ejecutar horario programado
   */
  async executeSchedule(schedule) {
    try {
      console.log(`Ejecutando horario ${schedule.id} para relé ${schedule.rele_id}`);
      
      // Activar relé
      this.gpioController.controlRele(
        schedule.rele_id, 
        true, 
        `Horario programado - ${schedule.start_time} a ${schedule.end_time}`
      );
      
      // Programar desactivación
      const startTime = moment(schedule.start_time, 'HH:mm');
      const endTime = moment(schedule.end_time, 'HH:mm');
      let duration = endTime.diff(startTime, 'seconds');
      
      // Si la duración es negativa, significa que cruza la medianoche
      if (duration < 0) {
        duration += 24 * 60 * 60; // Agregar 24 horas
      }
      
      // Programar desactivación
      setTimeout(() => {
        this.gpioController.controlRele(
          schedule.rele_id, 
          false, 
          `Fin de horario programado - ${schedule.start_time} a ${schedule.end_time}`
        );
      }, duration * 1000);
      
      // Guardar log
      this.database.saveSystemLog('info', 
        `Horario ${schedule.id} ejecutado para relé ${schedule.rele_id}`, 
        'Scheduler'
      );
      
    } catch (error) {
      console.error(`Error ejecutando horario ${schedule.id}:`, error);
      this.database.saveSystemLog('error', 
        `Error ejecutando horario ${schedule.id}: ${error.message}`, 
        'Scheduler'
      );
    }
  }

  /**
   * Agregar condición de activación
   */
  addCondition(condition) {
    try {
      const conditionId = `condition_${condition.id}`;
      
      this.activeConditions.set(conditionId, condition);
      
      console.log(`Condición ${condition.id} agregada para relé ${condition.rele_id}`);
      
    } catch (error) {
      console.error(`Error agregando condición ${condition.id}:`, error);
    }
  }

  /**
   * Iniciar verificador de condiciones
   */
  startConditionChecker() {
    setInterval(() => {
      this.checkConditions();
    }, config.sensors.conditionCheckInterval);
    
    console.log('Verificador de condiciones iniciado');
  }

  /**
   * Verificar condiciones ambientales
   */
  async checkConditions() {
    try {
      // Leer sensor DHT11
      const sensorData = this.gpioController.readDHT11();
      
      if (!sensorData) {
        return; // No hay datos del sensor
      }
      
      const { temperature, humidity } = sensorData;
      
      // Verificar cada condición activa
      for (const [conditionId, condition] of this.activeConditions) {
        await this.evaluateCondition(condition, temperature, humidity);
      }
      
    } catch (error) {
      console.error('Error verificando condiciones:', error);
    }
  }

  /**
   * Evaluar una condición específica
   */
  async evaluateCondition(condition, temperature, humidity) {
    try {
      let shouldActivate = false;
      let currentValue = 0;
      
      // Determinar valor actual según tipo de condición
      if (condition.condition_type === 'temperature') {
        currentValue = temperature;
      } else if (condition.condition_type === 'humidity') {
        currentValue = humidity;
      }
      
      // Evaluar condición según operador
      switch (condition.operator) {
        case '>':
          shouldActivate = currentValue > condition.threshold_value;
          break;
        case '<':
          shouldActivate = currentValue < condition.threshold_value;
          break;
        case '>=':
          shouldActivate = currentValue >= condition.threshold_value;
          break;
        case '<=':
          shouldActivate = currentValue <= condition.threshold_value;
          break;
        case '==':
          shouldActivate = Math.abs(currentValue - condition.threshold_value) < 0.5;
          break;
        default:
          console.warn(`Operador desconocido: ${condition.operator}`);
          return;
      }
      
      // Si la condición se cumple, ejecutar acción
      if (shouldActivate) {
        await this.executeCondition(condition, currentValue);
      }
      
    } catch (error) {
      console.error(`Error evaluando condición ${condition.id}:`, error);
    }
  }

  /**
   * Ejecutar acción de condición
   */
  async executeCondition(condition, currentValue) {
    try {
      console.log(`Condición ${condition.id} activada: ${condition.condition_type} ${condition.operator} ${condition.threshold_value} (actual: ${currentValue})`);
      
      if (condition.action === 'activate') {
        // Activar relé
        this.gpioController.controlRele(
          condition.rele_id,
          true,
          `Condición: ${condition.condition_type} ${condition.operator} ${condition.threshold_value}`
        );
        
        // Programar desactivación automática
        if (condition.duration > 0) {
          setTimeout(() => {
            this.gpioController.controlRele(
              condition.rele_id,
              false,
              `Fin de condición: ${condition.condition_type} ${condition.operator} ${condition.threshold_value}`
            );
          }, condition.duration * 1000);
        }
        
      } else if (condition.action === 'deactivate') {
        // Desactivar relé
        this.gpioController.controlRele(
          condition.rele_id,
          false,
          `Condición: ${condition.condition_type} ${condition.operator} ${condition.threshold_value}`
        );
      }
      
      // Guardar log
      this.database.saveSystemLog('info', 
        `Condición ${condition.id} ejecutada para relé ${condition.rele_id}`, 
        'Scheduler'
      );
      
    } catch (error) {
      console.error(`Error ejecutando condición ${condition.id}:`, error);
      this.database.saveSystemLog('error', 
        `Error ejecutando condición ${condition.id}: ${error.message}`, 
        'Scheduler'
      );
    }
  }

  /**
   * Iniciar tareas programadas
   */
  startScheduledTasks() {
    // Tarea de respaldo automático
    if (config.backup.enabled) {
      const backupTask = cron.schedule(`0 ${config.backup.frequency} * * *`, () => {
        this.createBackup();
      }, {
        scheduled: false,
        timezone: config.scheduling.timezone
      });
      
      backupTask.start();
      this.scheduledTasks.set('backup', backupTask);
    }
    
    // Tarea de limpieza de logs
    const logCleanupTask = cron.schedule('0 2 * * *', () => {
      this.cleanupOldLogs();
    }, {
      scheduled: false,
      timezone: config.scheduling.timezone
    });
    
    logCleanupTask.start();
    this.scheduledTasks.set('logCleanup', logCleanupTask);
    
    console.log('Tareas programadas iniciadas');
  }

  /**
   * Crear respaldo automático
   */
  async createBackup() {
    try {
      console.log('Creando respaldo automático...');
      
      const backupPath = await this.database.createBackup();
      
      this.database.saveSystemLog('info', 
        `Respaldo automático creado: ${backupPath}`, 
        'Scheduler'
      );
      
      console.log(`Respaldo creado: ${backupPath}`);
      
    } catch (error) {
      console.error('Error creando respaldo:', error);
      this.database.saveSystemLog('error', 
        `Error creando respaldo: ${error.message}`, 
        'Scheduler'
      );
    }
  }

  /**
   * Limpiar logs antiguos
   */
  async cleanupOldLogs() {
    try {
      console.log('Limpiando logs antiguos...');
      
      // Eliminar logs de más de 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Esta funcionalidad se implementaría en la base de datos
      // Por ahora solo es un log
      
      this.database.saveSystemLog('info', 'Limpieza de logs programada ejecutada', 'Scheduler');
      
    } catch (error) {
      console.error('Error limpiando logs:', error);
    }
  }

  /**
   * Obtener estado del programador
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeSchedules: this.activeSchedules.size,
      activeConditions: this.activeConditions.size,
      scheduledTasks: this.scheduledTasks.size,
      nextBackup: config.backup.enabled ? `Cada ${config.backup.frequency} horas` : 'Deshabilitado'
    };
  }

  /**
   * Detener programador
   */
  stop() {
    try {
      // Detener todas las tareas cron
      this.scheduledTasks.forEach((task, name) => {
        task.stop();
        console.log(`Tarea ${name} detenida`);
      });
      
      // Limpiar mapas
      this.activeSchedules.clear();
      this.activeConditions.clear();
      this.scheduledTasks.clear();
      
      this.isRunning = false;
      
      console.log('Programador detenido');
      this.database.saveSystemLog('info', 'Programador detenido', 'Scheduler');
      
    } catch (error) {
      console.error('Error deteniendo programador:', error);
    }
  }

  /**
   * Reiniciar programador
   */
  async restart() {
    try {
      console.log('Reiniciando programador...');
      
      this.stop();
      await this.init();
      
      console.log('Programador reiniciado');
      
    } catch (error) {
      console.error('Error reiniciando programador:', error);
    }
  }
}

module.exports = Scheduler; 