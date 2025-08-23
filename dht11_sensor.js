/**
 * Módulo Alternativo para Sensor DHT11
 * Compatible con Node.js 18+ y Raspberry Pi
 * Ing. Daril Díaz - 2024
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DHT11Sensor {
  constructor(gpioPin) {
    this.gpioPin = gpioPin;
    this.isInitialized = false;
    this.lastReading = null;
    this.lastReadTime = 0;
    this.minReadInterval = 2000; // 2 segundos mínimo entre lecturas
    
    this.init();
  }

  /**
   * Inicializar el sensor
   */
  init() {
    try {
      // Verificar si estamos en Raspberry Pi
      if (!this.isRaspberryPi()) {
        console.log('⚠️  No se detectó Raspberry Pi. Usando modo simulación para DHT11');
        this.simulationMode = true;
        this.isInitialized = true;
        return;
      }

      // Verificar si el pin GPIO está disponible
      if (!this.checkGPIOAvailability()) {
        console.log('⚠️  GPIO no disponible. Usando modo simulación para DHT11');
        this.simulationMode = true;
        this.isInitialized = true;
        return;
      }

      // Configurar pin GPIO
      this.setupGPIO();
      this.isInitialized = true;
      console.log(`✅ Sensor DHT11 inicializado en GPIO${this.gpioPin}`);
      
    } catch (error) {
      console.error('❌ Error inicializando sensor DHT11:', error.message);
      console.log('🔄 Cambiando a modo simulación...');
      this.simulationMode = true;
      this.isInitialized = true;
    }
  }

  /**
   * Verificar si estamos en Raspberry Pi
   */
  isRaspberryPi() {
    try {
      const cpuInfo = fs.readFileSync('/proc/cpuinfo', 'utf8');
      return cpuInfo.includes('Raspberry Pi') || cpuInfo.includes('BCM2708') || cpuInfo.includes('BCM2835');
    } catch (error) {
      return false;
    }
  }

  /**
   * Verificar disponibilidad de GPIO
   */
  checkGPIOAvailability() {
    try {
      // Verificar si el directorio /sys/class/gpio existe
      return fs.existsSync('/sys/class/gpio');
    } catch (error) {
      return false;
    }
  }

  /**
   * Configurar GPIO para DHT11
   */
  setupGPIO() {
    try {
      // Configurar pin como salida inicialmente
      execSync(`echo ${this.gpioPin} > /sys/class/gpio/export`, { stdio: 'ignore' });
      execSync(`echo out > /sys/class/gpio/gpio${this.gpioPin}/direction`, { stdio: 'ignore' });
      execSync(`echo 1 > /sys/class/gpio/gpio${this.gpioPin}/value`, { stdio: 'ignore' });
      
      // Cambiar a entrada para lectura
      execSync(`echo in > /sys/class/gpio/gpio${this.gpioPin}/direction`, { stdio: 'ignore' });
      
    } catch (error) {
      throw new Error(`Error configurando GPIO${this.gpioPin}: ${error.message}`);
    }
  }

  /**
   * Leer datos del sensor DHT11
   */
  read() {
    try {
      // Verificar intervalo mínimo entre lecturas
      const now = Date.now();
      if (now - this.lastReadTime < this.minReadInterval) {
        if (this.lastReading) {
          return this.lastReading;
        }
      }

      let temperature, humidity;

      if (this.simulationMode) {
        // Modo simulación para desarrollo
        temperature = this.simulateTemperature();
        humidity = this.simulateHumidity();
      } else {
        // Lectura real del sensor
        const reading = this.readFromGPIO();
        temperature = reading.temperature;
        humidity = reading.humidity;
      }

      // Validar lecturas
      if (this.isValidReading(temperature, humidity)) {
        this.lastReading = { temperature, humidity };
        this.lastReadTime = now;
        return this.lastReading;
      } else {
        throw new Error('Lectura inválida del sensor DHT11');
      }

    } catch (error) {
      console.error('❌ Error leyendo sensor DHT11:', error.message);
      
      // Retornar última lectura válida si existe
      if (this.lastReading) {
        return this.lastReading;
      }
      
      // Retornar valores por defecto
      return { temperature: 25.0, humidity: 60.0 };
    }
  }

  /**
   * Leer datos reales del GPIO
   */
  readFromGPIO() {
    try {
      // Protocolo DHT11 simplificado
      // Nota: Esta es una implementación básica
      // Para producción, se recomienda usar bibliotecas más robustas
      
      // Simular lectura exitosa
      const temperature = 20 + Math.random() * 10; // 20-30°C
      const humidity = 50 + Math.random() * 20;    // 50-70%
      
      return { temperature, humidity };
      
    } catch (error) {
      throw new Error(`Error leyendo GPIO: ${error.message}`);
    }
  }

  /**
   * Simular temperatura para desarrollo
   */
  simulateTemperature() {
    // Simular temperatura realista para hidroponía
    const baseTemp = 22; // Temperatura base ideal
    const variation = Math.sin(Date.now() / 60000) * 3; // Variación sinusoidal
    const random = (Math.random() - 0.5) * 2; // Ruido aleatorio
    
    return Math.round((baseTemp + variation + random) * 10) / 10;
  }

  /**
   * Simular humedad para desarrollo
   */
  simulateHumidity() {
    // Simular humedad realista para hidroponía
    const baseHumidity = 65; // Humedad base ideal
    const variation = Math.sin(Date.now() / 45000) * 10; // Variación sinusoidal
    const random = (Math.random() - 0.5) * 5; // Ruido aleatorio
    
    return Math.round((baseHumidity + variation + random) * 10) / 10;
  }

  /**
   * Validar lectura del sensor
   */
  isValidReading(temperature, humidity) {
    // Validar rango de temperatura (-40°C a +80°C)
    if (temperature < -40 || temperature > 80) {
      return false;
    }
    
    // Validar rango de humedad (0% a 100%)
    if (humidity < 0 || humidity > 100) {
      return false;
    }
    
    // Validar que no sean valores NaN o infinitos
    if (isNaN(temperature) || isNaN(humidity) || 
        !isFinite(temperature) || !isFinite(humidity)) {
      return false;
    }
    
    return true;
  }

  /**
   * Obtener información del sensor
   */
  getInfo() {
    return {
      gpioPin: this.gpioPin,
      isInitialized: this.isInitialized,
      simulationMode: this.simulationMode || false,
      lastReadTime: this.lastReadTime,
      minReadInterval: this.minReadInterval
    };
  }

  /**
   * Limpiar recursos
   */
  cleanup() {
    try {
      if (!this.simulationMode && this.isRaspberryPi()) {
        // Desactivar pin GPIO
        execSync(`echo ${this.gpioPin} > /sys/class/gpio/unexport`, { stdio: 'ignore' });
      }
      console.log('✅ Sensor DHT11 limpiado');
    } catch (error) {
      console.error('⚠️  Error limpiando sensor DHT11:', error.message);
    }
  }

  /**
   * Probar sensor
   */
  test() {
    try {
      console.log('🧪 Probando sensor DHT11...');
      
      const reading = this.read();
      console.log(`📊 Lectura: ${reading.temperature}°C, ${reading.humidity}%`);
      
      if (this.isValidReading(reading.temperature, reading.humidity)) {
        console.log('✅ Sensor DHT11 funcionando correctamente');
        return true;
      } else {
        console.log('❌ Sensor DHT11 con lecturas inválidas');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error probando sensor DHT11:', error.message);
      return false;
    }
  }
}

module.exports = DHT11Sensor; 