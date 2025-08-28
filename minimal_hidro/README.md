# 🌱 Control Minimalista de Hidroponía

Sistema simple y funcional para controlar 4 relés y medir temperatura/humedad desde una interfaz web.

## ✨ **Características:**

- 🔌 **Control de 4 relés** (ON/OFF)
- 🌡️ **Medición de temperatura** (simulada)
- 💧 **Medición de humedad** (simulada)
- 📱 **Interfaz web responsive**
- 🗄️ **Base de datos SQLite**
- 🚀 **Sin complicaciones**

## 🚀 **Instalación Rápida:**

### **1. Instalar Dependencias:**

```bash
npm install
```

### **2. Ejecutar Pruebas:**

```bash
npm test
```

### **3. Iniciar Servidor:**

```bash
npm start
```

### **4. Acceder a la Interfaz:**

```
http://localhost:3001
http://192.168.1.39:3001
```

## 📁 **Estructura del Proyecto:**

```
minimal_hidro/
├── server.js          # Servidor Express
├── views/
│   └── index.ejs     # Interfaz web
├── test_minimal.js    # Script de pruebas
├── package.json       # Dependencias
└── README.md          # Este archivo
```

## 🔧 **API Endpoints:**

### **Sensores:**

- `GET /api/temperature` - Obtener temperatura actual
- `GET /api/temperature/history` - Historial de lecturas

### **Relés:**

- `GET /api/relays` - Estado de todos los relés
- `POST /api/relay/:id/:action` - Controlar relé (on/off)

## 🎯 **Uso:**

1. **Ver temperatura y humedad** en tiempo real
2. **Activar/desactivar relés** con botones
3. **Actualizar datos** manualmente
4. **Monitorear estado** de cada relé

## 🧪 **Pruebas:**

```bash
# Probar funcionalidad básica
npm test

# Verificar base de datos
sqlite3 minimal_hidro.db ".tables"
```

## 🌐 **Interfaz Web:**

- **Diseño responsive** para móviles y desktop
- **Tema verde** de hidroponía
- **Actualización automática** cada 5 segundos
- **Mensajes de estado** en tiempo real

## 🔌 **Relés Disponibles:**

- **Relé 1:** Control general
- **Relé 2:** Bomba de agua
- **Relé 3:** Ventilador
- **Relé 4:** Iluminación

## 📊 **Base de Datos:**

- **SQLite** simple y ligero
- **Tabla de temperatura** con historial
- **Tabla de relés** con estados
- **Timestamps** automáticos

## 🚨 **Notas:**

- **Puerto 3001** para evitar conflictos
- **Simulación de sensor** (no hardware real)
- **Base de datos local** (minimal_hidro.db)
- **Sin autenticación** (solo para pruebas)

## 🎉 **¡Listo para Usar!**

Sistema simple, funcional y sin complicaciones para probar controles básicos de hidroponía.

---

**Ing. Daril Díaz** - Sistema de Hidroponía Automatizado © 2024
