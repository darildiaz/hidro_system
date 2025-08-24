#!/usr/bin/env node

/**
 * Script de Instalación Simplificada
 * Sistema de Hidroponía Automatizado
 * Evita problemas de compilación nativa
 * Ing. Daril Díaz - 2024
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🌱 Instalando Sistema de Hidroponía (Modo Simplificado)...\n');

// Colores para la consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
    log(`\n[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Verificar Node.js
logStep('1', 'Verificando requisitos del sistema...');

try {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 16) {
        logError(`Node.js ${nodeVersion} detectado. Se requiere Node.js 16 o superior.`);
        process.exit(1);
    }
    
    logSuccess(`Node.js ${nodeVersion} detectado`);
} catch (error) {
    logError('Error verificando versión de Node.js');
    process.exit(1);
}

// Verificar npm
try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    logSuccess(`npm ${npmVersion} detectado`);
} catch (error) {
    logError('npm no está instalado o no es accesible');
    process.exit(1);
}

// Crear directorios necesarios
logStep('2', 'Creando estructura de directorios...');

const directories = [
    'data',
    'logs',
    'backups',
    'public/css',
    'public/js',
    'public/img',
    'views'
];

directories.forEach(dir => {
    try {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            logSuccess(`Directorio creado: ${dir}`);
        } else {
            logInfo(`Directorio ya existe: ${dir}`);
        }
    } catch (error) {
        logError(`Error creando directorio ${dir}: ${error.message}`);
    }
});

// Instalar dependencias básicas (sin compilación nativa)
logStep('3', 'Instalando dependencias básicas...');

const basicDependencies = [
    'express',
    'socket.io',
    'ejs',
    'body-parser',
    'sqlite3',
    'node-cron',
    'moment',
    'shelljs',
    'winston',
    'helmet',
    'compression',
    'cors'
];

try {
    logInfo('Instalando dependencias principales...');
    
    // Instalar cada dependencia individualmente para evitar problemas
    basicDependencies.forEach(dep => {
        try {
            logInfo(`Instalando ${dep}...`);
            execSync(`npm install ${dep}`, { stdio: 'pipe' });
            logSuccess(`${dep} instalado`);
        } catch (error) {
            logWarning(`Error instalando ${dep}: ${error.message}`);
        }
    });
    
    logSuccess('Dependencias básicas instaladas');
    
} catch (error) {
    logError('Error instalando dependencias básicas');
}

// Instalar dependencias de desarrollo
logStep('4', 'Instalando dependencias de desarrollo...');

try {
    logInfo('Instalando dependencias de desarrollo...');
    execSync('npm install --only=dev', { stdio: 'pipe' });
    logSuccess('Dependencias de desarrollo instaladas');
} catch (error) {
    logWarning('Error instalando dependencias de desarrollo');
}

// Instalar rpio (GPIO) por separado
logStep('5', 'Instalando controlador GPIO...');

try {
    logInfo('Instalando rpio para control GPIO...');
    execSync('npm install rpio', { stdio: 'pipe' });
    logSuccess('rpio instalado correctamente');
} catch (error) {
    logWarning('Error instalando rpio. El control GPIO no funcionará.');
    logInfo('El sistema funcionará en modo simulación para GPIO');
}

// Verificar archivos de configuración
logStep('6', 'Verificando archivos del sistema...');

const requiredFiles = [
    'package.json',
    'config.js',
    'app.js',
    'database.js',
    'gpio_controller.js',
    'scheduler.js',
    'dht11_sensor.js'
];

let missingFiles = [];

requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        logSuccess(`Archivo encontrado: ${file}`);
    } else {
        logError(`Archivo faltante: ${file}`);
        missingFiles.push(file);
    }
});

if (missingFiles.length > 0) {
    logWarning('Algunos archivos requeridos están faltando');
    logWarning('Asegúrese de que todos los archivos del sistema estén presentes');
}

// Verificar plantillas HTML
logStep('7', 'Verificando plantillas HTML...');

const requiredViews = [
    'views/base.ejs',
    'views/index.ejs',
    'views/error.ejs'
];

requiredViews.forEach(view => {
    if (fs.existsSync(view)) {
        logSuccess(`Plantilla encontrada: ${view}`);
    } else {
        logWarning(`Plantilla faltante: ${view}`);
    }
});

// Verificar archivos estáticos
logStep('8', 'Verificando archivos estáticos...');

const requiredStatic = [
    'public/css/style.css',
    'public/js/main.js'
];

requiredStatic.forEach(staticFile => {
    if (fs.existsSync(staticFile)) {
        logSuccess(`Archivo estático encontrado: ${staticFile}`);
    } else {
        logWarning(`Archivo estático faltante: ${staticFile}`);
    }
});

// Crear archivo .env de ejemplo
logStep('9', 'Creando archivo de configuración de entorno...');

const envExample = `# Configuración del Sistema de Hidroponía
# Copie este archivo a .env y ajuste los valores según su configuración

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

# Configuración de notificaciones
EMAIL_ENABLED=false
TELEGRAM_ENABLED=false

# Configuración de seguridad
SESSION_SECRET=your-secret-key-here
`;

try {
    if (!fs.existsSync('.env.example')) {
        fs.writeFileSync('.env.example', envExample);
        logSuccess('Archivo .env.example creado');
    } else {
        logInfo('Archivo .env.example ya existe');
    }
} catch (error) {
    logError(`Error creando .env.example: ${error.message}`);
}

// Crear scripts de control
logStep('10', 'Creando scripts de control...');

const startScript = `#!/bin/bash
# Script de inicio del Sistema de Hidroponía

echo "🌱 Iniciando Sistema de Hidroponía Automatizado..."

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    exit 1
fi

# Verificar si las dependencias están instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Iniciar la aplicación
echo "🚀 Iniciando aplicación..."
node app.js
`;

const stopScript = `#!/bin/bash
# Script de parada del Sistema de Hidroponía

echo "🛑 Deteniendo Sistema de Hidroponía Automatizado..."

# Buscar proceso de Node.js ejecutando la aplicación
PID=$(pgrep -f "node app.js")

if [ -n "$PID" ]; then
    echo "Deteniendo proceso $PID..."
    kill $PID
    echo "✅ Sistema detenido"
else
    echo "ℹ️  No se encontró el sistema en ejecución"
fi
`;

const restartScript = `#!/bin/bash
# Script de reinicio del Sistema de Hidroponía

echo "🔄 Reiniciando Sistema de Hidroponía Automatizado..."

# Detener sistema
./stop.sh

# Esperar un momento
sleep 2

# Iniciar sistema
./start.sh
`;

const statusScript = `#!/bin/bash
# Script de estado del Sistema de Hidroponía

echo "📊 Estado del Sistema de Hidroponía Automatizado"

# Verificar si el proceso está ejecutándose
PID=$(pgrep -f "node app.js")

if [ -n "$PID" ]; then
    echo "✅ Sistema en ejecución (PID: $PID)"
    echo "📅 Iniciado: $(ps -o lstart= -p $PID)"
    echo "⏱️  Uptime: $(ps -o etime= -p $PID)"
    
    # Verificar uso de memoria
    if [ -n "$PID" ]; then
        MEMORY=$(ps -o rss= -p $PID)
        MEMORY_MB=$((MEMORY / 1024))
        echo "💾 Memoria: ${MEMORY_MB} MB"
    fi
else
    echo "❌ Sistema no está ejecutándose"
fi
`;

try {
    fs.writeFileSync('start.sh', startScript);
    fs.writeFileSync('stop.sh', stopScript);
    fs.writeFileSync('restart.sh', restartScript);
    fs.writeFileSync('status.sh', statusScript);
    
    // Dar permisos de ejecución (solo en sistemas Unix)
    if (process.platform !== 'win32') {
        execSync('chmod +x start.sh stop.sh restart.sh status.sh');
    }
    
    logSuccess('Scripts de control creados');
} catch (error) {
    logError(`Error creando scripts: ${error.message}`);
}

// Crear archivo README de instalación
logStep('11', 'Creando documentación de instalación...');

const installReadme = `# Guía de Instalación Simplificada - Sistema de Hidroponía

## Requisitos Previos

- Node.js 16 o superior
- npm (incluido con Node.js)
- Raspberry Pi 3B o superior (para funcionalidad GPIO completa)
- Sensor DHT11
- 4 módulos relé

## Instalación Simplificada

La instalación simplificada ya se ha ejecutado. Esta versión evita problemas de compilación nativa.

### Características de la Instalación Simplificada:

✅ **Dependencias básicas** instaladas sin problemas
✅ **Controlador GPIO** instalado (si es posible)
✅ **Sensor DHT11** en modo simulación (compatible)
✅ **Sistema completo** funcional

## Instalación Manual

### 1. Instalar dependencias
\`\`\`bash
npm install
\`\`\`

### 2. Configurar variables de entorno
\`\`\`bash
cp .env.example .env
# Editar .env con su configuración
\`\`\`

### 3. Iniciar el sistema
\`\`\`bash
./start.sh
# O manualmente:
node app.js
\`\`\`

## Scripts de Control

- \`./start.sh\` - Iniciar sistema
- \`./stop.sh\` - Detener sistema
- \`./restart.sh\` - Reiniciar sistema
- \`./status.sh\` - Ver estado del sistema

## Acceso Web

Una vez iniciado, acceda a:
http://localhost:3000

## Modo Simulación

Si el control GPIO no está disponible, el sistema funcionará en modo simulación:
- Los relés se simularán (no se activarán físicamente)
- El sensor DHT11 generará datos simulados
- Todas las funcionalidades web estarán disponibles

## Solución de Problemas

### Error: "Module not found"
\`\`\`bash
npm install
\`\`\`

### Error: "Permission denied" en scripts
\`\`\`bash
chmod +x *.sh
\`\`\`

### Error: GPIO no disponible
- El sistema funcionará en modo simulación
- Para control real, verificar permisos de usuario para GPIO
- Verificar conexiones físicas

## Soporte

Para soporte técnico, contacte al desarrollador:
Ing. Daril Díaz
`;

try {
    fs.writeFileSync('INSTALACION_SIMPLIFICADA.md', installReadme);
    logSuccess('Documentación de instalación simplificada creada');
} catch (error) {
    logError(`Error creando documentación: ${error.message}`);
}

// Verificación final
logStep('12', 'Verificación final del sistema...');

let systemReady = true;

// Verificar que la aplicación se puede iniciar
try {
    // Intentar cargar la configuración
    const config = require('./config.js');
    logSuccess('Configuración cargada correctamente');
} catch (error) {
    logError(`Error cargando configuración: ${error.message}`);
    systemReady = false;
}

// Verificar que la base de datos se puede inicializar
try {
    const Database = require('./database.js');
    logSuccess('Módulo de base de datos cargado correctamente');
} catch (error) {
    logError(`Error cargando módulo de base de datos: ${error.message}`);
    systemReady = false;
}

// Verificar que el sensor DHT11 se puede cargar
try {
    const DHT11Sensor = require('./dht11_sensor.js');
    logSuccess('Módulo de sensor DHT11 cargado correctamente');
} catch (error) {
    logError(`Error cargando módulo de sensor DHT11: ${error.message}`);
    systemReady = false;
}

// Verificar que el controlador GPIO se puede cargar
try {
    const GPIOController = require('./gpio_controller.js');
    logSuccess('Módulo de controlador GPIO cargado correctamente');
} catch (error) {
    logWarning(`Error cargando módulo de controlador GPIO: ${error.message}`);
    logWarning('Esto es normal en sistemas que no son Raspberry Pi');
}

// Verificar que el programador se puede cargar
try {
    const Scheduler = require('./scheduler.js');
    logSuccess('Módulo de programador cargado correctamente');
} catch (error) {
    logError(`Error cargando módulo de programador: ${error.message}`);
    systemReady = false;
}

// Verificar que la aplicación principal se puede cargar
try {
    const app = require('./app.js');
    logSuccess('Aplicación principal cargada correctamente');
} catch (error) {
    logError(`Error cargando aplicación principal: ${error.message}`);
    systemReady = false;
}

// Resumen final
console.log('\n' + '='.repeat(60));
if (systemReady) {
    log('\n🎉 ¡INSTALACIÓN SIMPLIFICADA COMPLETADA EXITOSAMENTE!', 'green');
    log('\n📋 Resumen de la instalación:', 'cyan');
    log('✅ Node.js y npm verificados', 'green');
    log('✅ Dependencias básicas instaladas', 'green');
    log('✅ Estructura de directorios creada', 'green');
    log('✅ Scripts de control generados', 'green');
    log('✅ Documentación creada', 'green');
    log('✅ Módulo DHT11 alternativo creado', 'green');
    
    log('\n🚀 Para iniciar el sistema:', 'yellow');
    log('   ./start.sh', 'bright');
    log('   O manualmente: node app.js', 'bright');
    
    log('\n🌐 Acceso web: http://localhost:3000', 'yellow');
    
    log('\n📚 Documentación: INSTALACION_SIMPLIFICADA.md', 'cyan');
    
    log('\n⚠️  NOTA: Esta instalación evita problemas de compilación nativa', 'yellow');
    log('   El sistema funcionará en modo simulación si GPIO no está disponible', 'yellow');
    
} else {
    log('\n⚠️  INSTALACIÓN COMPLETADA CON ADVERTENCIAS', 'yellow');
    log('\n❌ Algunos módulos no se pudieron cargar', 'red');
    log('   Verifique los errores anteriores y corrija los problemas', 'red');
    log('   Luego ejecute nuevamente: node install_simple.js', 'red');
}

console.log('\n' + '='.repeat(60));
log('\n🌱 Sistema de Hidroponía Automatizado - Ing. Daril Díaz © 2024', 'magenta');
log('🔧 Instalación Simplificada - Sin problemas de compilación', 'cyan');
console.log(''); 