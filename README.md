# 🌱 Sistema de Hidroponía Automatizado - Node.js

Sistema completo de control automatizado para hidroponía usando **Node.js**, **Express** y **Socket.IO**, con control de 4 relés, monitoreo de temperatura/humedad DHT11 e interfaz web moderna.

## 🚀 Características Principales

### 🔌 Control de Relés

- **4 relés independientes** con control individual desde la web
- **Programación horaria** personalizable para cada relé
- **Control por condiciones** (temperatura, humedad)
- **Activación/desactivación manual** con switches intuitivos
- **Activación temporal** programable (5min, 15min, personalizado)

### 🌡️ Monitoreo Ambiental

- **Sensor DHT11** para temperatura y humedad en tiempo real
- **Lecturas automáticas** cada minuto
- **Historial de datos** almacenado en SQLite
- **Alertas automáticas** por condiciones críticas
- **Gráficos en tiempo real** con Chart.js

### 🌐 Interfaz Web Moderna

- **Diseño responsivo** con Bootstrap 5
- **Tema verde** especializado para hidroponía
- **Actualizaciones en tiempo real** con Socket.IO
- **Dashboard intuitivo** con control visual de relés
- **Navegación completa** entre módulos del sistema

### ⚙️ Automatización Inteligente

- **Sistema de tareas programadas** con node-cron
- **Evaluación automática** de condiciones ambientales
- **Base de datos SQLite** para persistencia completa
- **Logs detallados** de todas las operaciones
- **Respaldo automático** de configuración y datos

## 🛠️ Tecnologías Utilizadas

- **Backend**: Node.js, Express.js
- **Base de Datos**: SQLite3
- **Tiempo Real**: Socket.IO
- **Frontend**: EJS, Bootstrap 5, Chart.js
- **GPIO**: rpio, rpi-dht-sensor
- **Programación**: node-cron, moment.js
- **Seguridad**: Helmet, CORS, Compression

## 🔌 Conexiones GPIO

### Sensor DHT11

```
DHT11          Raspberry Pi
VCC    →       3.3V (Pin 1)
DATA   →       GPIO17 (Pin 11)
GND    →       GND (Pin 6)
```

### Módulos Relé

```
Relé 1         Raspberry Pi
VCC    →       5V (Pin 2)
GND    →       GND (Pin 6)
IN     →       GPIO2 (Pin 3)

Relé 2         Raspberry Pi
VCC    →       5V (Pin 2)
GND    →       GND (Pin 6)
IN     →       GPIO3 (Pin 5)

Relé 3         Raspberry Pi
VCC    →       5V (Pin 2)
GND    →       GND (Pin 6)
IN     →       GPIO4 (Pin 7)

Relé 4         Raspberry Pi
VCC    →       5V (Pin 2)
GND    →       GND (Pin 6)
IN     →       GPIO18 (Pin 12)
```

## 🚀 Instalación Rápida

### Opción 1: Instalación Automática (Recomendada)

```bash
# Clonar o descargar el proyecto
git clone <url-del-repositorio>
cd hidro_system

# Ejecutar instalación automática
node install.js
```

### Opción 2: Instalación Manual

```bash
# Instalar dependencias
npm install

# Crear archivo de configuración
cp .env.example .env
# Editar .env con su configuración

# Iniciar sistema
npm start
```

## 🔧 Configuración

### Variables de Entorno (.env)

```bash
# Puerto del servidor
PORT=3000

# Entorno de ejecución
NODE_ENV=production

# Configuración de la base de datos
DB_PATH=./data/auto_hidro.db

# Configuración de logs
LOG_LEVEL=info

# Configuración de respaldos
BACKUP_ENABLED=true
BACKUP_FREQUENCY=24
```

### Configuración GPIO (config.js)

```javascript
gpio: {
    // Pines para los 4 relés
    relePins: [2, 3, 4, 18],

    // Pin para sensor DHT11
    dht11Pin: 17,

    // Configuración de relés (activos en bajo)
    releActiveLow: true
}
```

## 🚀 Uso del Sistema

### Iniciar Sistema

```bash
# Usando script automático
./start.sh

# O manualmente
npm start
# o
node app.js
```

### Scripts de Control

```bash
./start.sh      # Iniciar sistema
./stop.sh       # Detener sistema
./restart.sh    # Reiniciar sistema
./status.sh     # Ver estado del sistema
```

### Acceso Web

```
http://localhost:3000
```

## 📱 Interfaz Web

### Dashboard Principal

- **Estado en tiempo real** de sensores y relés
- **Control visual** de los 4 relés con switches
- **Gráficos** de temperatura y humedad
- **Información del sistema** y estadísticas

### Programación de Horarios

- **Configuración de horarios** para cada relé
- **Selección de días** de la semana
- **Definición de tiempos** de inicio y fin
- **Activación/desactivación** automática

### Condiciones de Activación

- **Umbrales de temperatura** y humedad
- **Operadores lógicos** (>, <, >=, <=, ==)
- **Acciones automáticas** (activar/desactivar)
- **Duración configurable** de activación

### Monitoreo y Logs

- **Historial completo** de lecturas de sensores
- **Logs del sistema** con diferentes niveles
- **Estado de relés** con timestamps
- **Alertas y notificaciones**

### Configuración del Sistema

- **Parámetros GPIO** configurables
- **Umbrales de sensores** ajustables
- **Configuración de respaldos**
- **Estado del programador**

## 🔌 API REST

### Control de Relés

```bash
# Controlar relé específico
POST /api/rele/control
{
    "releId": 1,
    "state": true,
    "reason": "Activación manual"
}

# Alternar estado de relé
POST /api/rele/toggle
{
    "releId": 1
}

# Activación temporal
POST /api/rele/timed
{
    "releId": 1,
    "duration": 300,
    "reason": "Riego programado"
}
```

### Sensores

```bash
# Lectura actual
GET /api/sensors/current

# Historial de lecturas
GET /api/sensors/history?limit=100&startDate=2024-01-01&endDate=2024-01-31
```

### Sistema

```bash
# Estado del sistema
GET /api/system/status

# Control del sistema
POST /api/system/control
{
    "action": "restart_scheduler"
}
```

## 📊 Base de Datos

### Tablas Principales

- **sensor_readings**: Lecturas de temperatura y humedad
- **schedules**: Horarios programados para relés
- **conditions**: Condiciones de activación automática
- **rele_states**: Estado histórico de relés
- **system_logs**: Logs del sistema
- **system_config**: Configuraciones del sistema

### Respaldo Automático

- **Respaldo diario** configurable
- **Retención configurable** de respaldos
- **Respaldo manual** desde la interfaz web

## 🐛 Solución de Problemas

### Error: "Module not found"

```bash
npm install
```

### Error: GPIO no disponible

- Verificar que esté ejecutándose en Raspberry Pi
- Verificar permisos de usuario para GPIO
- Verificar conexiones físicas

### Error: Puerto en uso

```bash
# Cambiar puerto en config.js o .env
PORT=3001
```

### Error: Permisos de base de datos

```bash
# Verificar permisos del directorio data/
chmod 755 data/
```

## 🔮 Funcionalidades Futuras

- [ ] **Control por MQTT** para integración IoT
- [ ] **App móvil** para control remoto
- [ ] **Notificaciones** por email/Telegram
- [ ] **Múltiples sensores** DHT11
- [ ] **Control de pH** y EC del agua
- [ ] **Sistema de riego** por goteo
- [ ] **Integración con Home Assistant**
- [ ] **Dashboard avanzado** con más métricas

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Para contribuir:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🙏 Agradecimientos

- **Raspberry Pi Foundation** por el hardware
- **Node.js** por la plataforma de ejecución
- **Express.js** por el framework web
- **Bootstrap** por el diseño responsivo
- **Socket.IO** por la comunicación en tiempo real
- **Comunidad de hidroponía** por las ideas y feedback

## 📞 Soporte

Para soporte técnico o consultas:

- **Desarrollador**: Ing. Daril Díaz
- **Email**: [tu-email@ejemplo.com]
- **GitHub**: [tu-usuario-github]

---

**🌱 ¡Construye tu sistema de hidroponía inteligente con Node.js! 🚀**

## 📋 Estructura del Proyecto

```
hidro_system/
├── app.js                 # Aplicación principal Express
├── config.js             # Configuración del sistema
├── database.js           # Manejo de base de datos SQLite
├── gpio_controller.js    # Control de GPIO y relés
├── scheduler.js          # Sistema de programación horaria
├── install.js            # Script de instalación automática
├── package.json          # Dependencias del proyecto
├── .env.example          # Variables de entorno de ejemplo
├── start.sh              # Script de inicio
├── stop.sh               # Script de parada
├── restart.sh            # Script de reinicio
├── status.sh             # Script de estado
├── INSTALACION.md        # Guía de instalación
├── README.md             # Este archivo
├── views/                # Plantillas EJS
│   ├── base.ejs         # Plantilla base del sistema
│   ├── index.ejs        # Dashboard principal
│   └── error.ejs        # Página de manejo de errores
├── public/               # Archivos estáticos
│   ├── css/             # Estilos CSS
│   ├── js/              # JavaScript del cliente
│   └── img/             # Imágenes
├── data/                 # Base de datos SQLite
├── logs/                 # Archivos de log
└── backups/              # Respaldos automáticos
```
#   h i d r o _ s y s t e m  
 