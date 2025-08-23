/**
 * Controlador GPIO para Sistema de Hidroponía
 * Control de 4 relés y sensor DHT11
 * Ing. Daril Díaz - 2024
 */

const rpio = require('rpio');
const DHT11Sensor = require('./dht11_sensor');
const config = require('./config');
const Database = require('./database');

class GPIOController {
  constructor() {
    this.database = new Database();
    this.releStates = [false, false, false, false]; // Estado inicial de los 4 relés
    this.dht11 = null;
    this.isInitialized = false;
    this.init();
  }

  /**
   * Inicializar GPIO
   */
  init() {
    try {
      // Inicializar rpio con mapeo GPIO
      rpio.init({
        mapping: 'gpio',
        mock: 'raspberry-pi-3' // Para desarrollo en otros sistemas
      });

      // Configurar pines de relés
      this.setupRelePins();
      
      // Configurar sensor DHT11
      this.setupDHT11();
      
      this.isInitialized = true;
      console.log('GPIO inicializado correctamente');
      
      // Guardar log del sistema
      this.database.saveSystemLog('info', 'GPIO inicializado correctamente', 'GPIOController');
      
    } catch (error) {
      console.error('Error inicializando GPIO:', error);
      this.database.saveSystemLog('error', `Error inicializando GPIO: ${error.message}`, 'GPIOController');
    }
  }

  /**
   * Configurar pines de relés
   */
  setupRelePins() {
    config.gpio.relePins.forEach((pin, index) => {
      try {
        // Configurar pin como salida
        rpio.open(pin, rpio.OUTPUT);
        
        // Establecer estado inicial
        const initialState = config.gpio.releActiveLow ? 
          (config.gpio.releInitialState ? rpio.LOW : rpio.HIGH) :
          (config.gpio.releInitialState ? rpio.HIGH : rpio.LOW);
        
        rpio.write(pin, initialState);
        
        // Guardar estado inicial en base de datos
        this.database.saveReleState(index + 1, config.gpio.releInitialState, 'Inicialización del sistema');
        
        console.log(`Relé ${index + 1} configurado en GPIO${pin}`);
        
      } catch (error) {
        console.error(`Error configurando relé ${index + 1} en GPIO${pin}:`, error);
      }
    });
  }

  /**
   * Configurar sensor DHT11
   */
  setupDHT11() {
    try {
      this.dht11 = new DHT11Sensor(config.gpio.dht11Pin);
      console.log(`Sensor DHT11 configurado en GPIO${config.gpio.dht11Pin}`);
    } catch (error) {
      console.error('Error configurando sensor DHT11:', error);
      this.database.saveSystemLog('error', `Error configurando DHT11: ${error.message}`, 'GPIOController');
    }
  }

  /**
   * Leer sensor DHT11
   */
  readDHT11() {
    if (!this.dht11) {
      throw new Error('Sensor DHT11 no inicializado');
    }

    try {
      const readout = this.dht11.read();
      
      if (!readout || readout.temperature === null || readout.humidity === null) {
        throw new Error('Lectura inválida del sensor DHT11');
      }

      const temperature = parseFloat(readout.temperature.toFixed(1));
      const humidity = parseFloat(readout.humidity.toFixed(1));

      // Guardar lectura en base de datos
      this.database.saveSensorReading(temperature, humidity);
      
      // Guardar log si hay valores fuera de rango
      this.checkThresholds(temperature, humidity);

      return { temperature, humidity };
      
    } catch (error) {
      console.error('Error leyendo sensor DHT11:', error);
      this.database.saveSystemLog('error', `Error leyendo DHT11: ${error.message}`, 'GPIOController');
      return null;
    }
  }

  /**
   * Verificar umbrales de temperatura y humedad
   */
  checkThresholds(temperature, humidity) {
    const thresholds = config.sensors.thresholds;
    
    if (temperature < thresholds.temperature.min || temperature > thresholds.temperature.max) {
      this.database.saveSystemLog('warn', 
        `Temperatura fuera de rango: ${temperature}°C (rango: ${thresholds.temperature.min}-${thresholds.temperature.max}°C)`, 
        'GPIOController'
      );
    }
    
    if (humidity < thresholds.humidity.min || humidity > thresholds.humidity.max) {
      this.database.saveSystemLog('warn', 
        `Humedad fuera de rango: ${humidity}% (rango: ${thresholds.humidity.min}-${thresholds.humidity.max}%)`, 
        'GPIOController'
      );
    }
  }

  /**
   * Controlar relé específico
   */
  controlRele(releId, state, reason = 'Control manual') {
    if (releId < 1 || releId > 4) {
      throw new Error('ID de relé inválido. Debe ser entre 1 y 4');
    }

    const pinIndex = releId - 1;
    const pin = config.gpio.relePins[pinIndex];
    
    try {
      // Determinar estado del pin según configuración
      let pinState;
      if (config.gpio.releActiveLow) {
        pinState = state ? rpio.LOW : rpio.HIGH;
      } else {
        pinState = state ? rpio.HIGH : rpio.LOW;
      }

      // Escribir estado en el pin
      rpio.write(pin, pinState);
      
      // Actualizar estado interno
      this.releStates[pinIndex] = state;
      
      // Guardar estado en base de datos
      this.database.saveReleState(releId, state, reason);
      
      // Guardar log del sistema
      const action = state ? 'activado' : 'desactivado';
      this.database.saveSystemLog('info', 
        `Relé ${releId} ${action} - Razón: ${reason}`, 
        'GPIOController'
      );

      console.log(`Relé ${releId} ${action} en GPIO${pin}`);
      return true;
      
    } catch (error) {
      console.error(`Error controlando relé ${releId}:`, error);
      this.database.saveSystemLog('error', 
        `Error controlando relé ${releId}: ${error.message}`, 
        'GPIOController'
      );
      return false;
    }
  }

  /**
   * Obtener estado actual de un relé
   */
  getReleState(releId) {
    if (releId < 1 || releId > 4) {
      throw new Error('ID de relé inválido. Debe ser entre 1 y 4');
    }
    
    return this.releStates[releId - 1];
  }

  /**
   * Obtener estado de todos los relés
   */
  getAllReleStates() {
    return this.releStates.map((state, index) => ({
      releId: index + 1,
      state: state,
      gpioPin: config.gpio.relePins[index]
    }));
  }

  /**
   * Activar relé por tiempo específico
   */
  activateReleTimed(releId, duration, reason = 'Activación temporal') {
    if (releId < 1 || releId > 4) {
      throw new Error('ID de relé inválido. Debe ser entre 1 y 4');
    }

    // Activar relé
    this.controlRele(releId, true, reason);
    
    // Programar desactivación automática
    setTimeout(() => {
      this.controlRele(releId, false, `${reason} - Desactivación automática`);
    }, duration * 1000); // Convertir segundos a milisegundos

    console.log(`Relé ${releId} activado por ${duration} segundos`);
  }

  /**
   * Activar todos los relés
   */
  activateAllRele(reason = 'Activación masiva') {
    for (let i = 1; i <= 4; i++) {
      this.controlRele(i, true, reason);
    }
  }

  /**
   * Desactivar todos los relés
   */
  deactivateAllRele(reason = 'Desactivación masiva') {
    for (let i = 1; i <= 4; i++) {
      this.controlRele(i, false, reason);
    }
  }

  /**
   * Alternar estado de un relé
   */
  toggleRele(releId, reason = 'Alternancia manual') {
    const currentState = this.getReleState(releId);
    const newState = !currentState;
    return this.controlRele(releId, newState, reason);
  }

  /**
   * Ejecutar secuencia de relés
   */
  executeReleSequence(sequence, reason = 'Secuencia programada') {
    if (!Array.isArray(sequence)) {
      throw new Error('Secuencia debe ser un array');
    }

    sequence.forEach((step, index) => {
      setTimeout(() => {
        if (step.releId && typeof step.state === 'boolean') {
          this.controlRele(step.releId, step.state, `${reason} - Paso ${index + 1}`);
        }
      }, step.delay * 1000);
    });

    console.log(`Secuencia de relés ejecutada: ${sequence.length} pasos`);
  }

  /**
   * Obtener información del sistema
   */
  getSystemInfo() {
    return {
      gpioInitialized: this.isInitialized,
      releCount: config.gpio.relePins.length,
      relePins: config.gpio.relePins,
      dht11Pin: config.gpio.dht11Pin,
      releStates: this.releStates,
      activeLow: config.gpio.releActiveLow
    };
  }

  /**
   * Limpiar GPIO al cerrar
   */
  cleanup() {
    try {
      // Desactivar todos los relés
      this.deactivateAllRele('Limpieza del sistema');
      
      // Cerrar pines GPIO
      config.gpio.relePins.forEach(pin => {
        rpio.close(pin);
      });
      
      console.log('GPIO limpiado correctamente');
      this.database.saveSystemLog('info', 'GPIO limpiado correctamente', 'GPIOController');
      
    } catch (error) {
      console.error('Error limpiando GPIO:', error);
      this.database.saveSystemLog('error', `Error limpiando GPIO: ${error.message}`, 'GPIOController');
    }
  }

  /**
   * Verificar estado de conexiones GPIO
   */
  testGPIOConnections() {
    const results = {
      rele: [],
      dht11: false,
      overall: true
    };

    // Probar relés
    config.gpio.relePins.forEach((pin, index) => {
      try {
        // Leer estado actual del pin
        const currentState = rpio.read(pin);
        results.rele.push({
          releId: index + 1,
          gpioPin: pin,
          status: 'OK',
          currentState: currentState
        });
      } catch (error) {
        results.rele.push({
          releId: index + 1,
          gpioPin: pin,
          status: 'ERROR',
          error: error.message
        });
        results.overall = false;
      }
    });

    // Probar sensor DHT11
    try {
      const reading = this.readDHT11();
      results.dht11 = reading !== null;
    } catch (error) {
      results.dht11 = false;
      results.overall = false;
    }

    return results;
  }
}

module.exports = GPIOController; 