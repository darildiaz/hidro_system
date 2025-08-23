/**
 * JavaScript Principal del Sistema de Hidroponía
 * Funciones comunes y utilidades
 * Ing. Daril Díaz - 2024
 */

// Variables globales
let systemStatus = {
    online: true,
    lastUpdate: new Date(),
    uptime: 0
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initializeCommonFunctions();
    setupGlobalEventListeners();
    startStatusUpdates();
});

/**
 * Inicializar funciones comunes
 */
function initializeCommonFunctions() {
    // Configurar tooltips de Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Configurar popovers de Bootstrap
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
    
    // Configurar modales
    setupModals();
    
    // Configurar notificaciones
    setupNotifications();
}

/**
 * Configurar event listeners globales
 */
function setupGlobalEventListeners() {
    // Event listener para confirmaciones
    document.addEventListener('click', function(e) {
        if (e.target.matches('[data-confirm]')) {
            e.preventDefault();
            const message = e.target.getAttribute('data-confirm');
            const action = e.target.getAttribute('data-action');
            
            showConfirmDialog(message, () => {
                if (action) {
                    executeAction(action, e.target);
                }
            });
        }
    });
    
    // Event listener para acciones del sistema
    document.addEventListener('click', function(e) {
        if (e.target.matches('#systemStatus')) {
            e.preventDefault();
            showSystemStatus();
        }
        
        if (e.target.matches('#createBackup')) {
            e.preventDefault();
            createBackup();
        }
        
        if (e.target.matches('#restartSystem')) {
            e.preventDefault();
            restartSystem();
        }
    });
    
    // Event listener para teclas de acceso rápido
    document.addEventListener('keydown', function(e) {
        // Ctrl + R para refrescar
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            location.reload();
        }
        
        // Ctrl + B para crear backup
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            createBackup();
        }
        
        // Ctrl + S para mostrar estado del sistema
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            showSystemStatus();
        }
    });
}

/**
 * Configurar modales
 */
function setupModals() {
    // Modal de confirmación
    const confirmModal = document.getElementById('confirmModal');
    if (confirmModal) {
        const confirmAction = document.getElementById('confirmAction');
        confirmAction.addEventListener('click', function() {
            if (window.pendingAction) {
                window.pendingAction();
                window.pendingAction = null;
            }
            bootstrap.Modal.getInstance(confirmModal).hide();
        });
    }
}

/**
 * Configurar notificaciones
 */
function setupNotifications() {
    // Configurar toast de notificaciones
    const toast = document.getElementById('notificationToast');
    if (toast) {
        // Configurar auto-hide después de 5 segundos
        toast.addEventListener('hidden.bs.toast', function() {
            // Limpiar contenido
            document.getElementById('toastMessage').textContent = '';
        });
    }
}

/**
 * Mostrar diálogo de confirmación
 */
function showConfirmDialog(message, callback) {
    const modal = document.getElementById('confirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    
    if (modal && confirmMessage) {
        confirmMessage.textContent = message;
        window.pendingAction = callback;
        
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    } else {
        // Fallback si no hay modal
        if (confirm(message)) {
            callback();
        }
    }
}

/**
 * Mostrar notificación
 */
function showNotification(message, type = 'info', duration = 5000) {
    const toast = document.getElementById('notificationToast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        
        // Cambiar clase del toast según el tipo
        toast.className = `toast toast-${type}`;
        
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        // Auto-hide después del tiempo especificado
        setTimeout(() => {
            bsToast.hide();
        }, duration);
    } else {
        // Fallback si no hay toast
        console.log(`${type.toUpperCase()}: ${message}`);
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

/**
 * Mostrar estado del sistema
 */
async function showSystemStatus() {
    try {
        const response = await fetch('/api/system/status');
        const data = await response.json();
        
        if (data.success) {
            const status = data.status;
            let statusHtml = `
                <div class="row">
                    <div class="col-md-6">
                        <h6>Estado del Sistema</h6>
                        <ul class="list-unstyled">
                            <li><strong>GPIO:</strong> ${status.gpio.gpioInitialized ? '✅ Inicializado' : '❌ Error'}</li>
                            <li><strong>Programador:</strong> ${status.scheduler.isRunning ? '✅ Activo' : '❌ Inactivo'}</li>
                            <li><strong>Uptime:</strong> ${formatUptime(status.uptime)}</li>
                            <li><strong>Memoria:</strong> ${formatBytes(status.memory.heapUsed)} / ${formatBytes(status.memory.heapTotal)}</li>
                        </ul>
                    </div>
                    <div class="col-md-6">
                        <h6>Configuración GPIO</h6>
                        <ul class="list-unstyled">
                            <li><strong>Relés activos:</strong> ${status.gpio.releCount}</li>
                            <li><strong>Pines:</strong> ${status.gpio.relePins.join(', ')}</li>
                            <li><strong>DHT11:</strong> GPIO ${status.gpio.dht11Pin}</li>
                            <li><strong>Activo en bajo:</strong> ${status.gpio.activeLow ? 'Sí' : 'No'}</li>
                        </ul>
                    </div>
                </div>
                <div class="row mt-3">
                    <div class="col-12">
                        <h6>Programador</h6>
                        <ul class="list-unstyled">
                            <li><strong>Horarios activos:</strong> ${status.scheduler.activeSchedules}</li>
                            <li><strong>Condiciones activas:</strong> ${status.scheduler.activeConditions}</li>
                            <li><strong>Tareas programadas:</strong> ${status.scheduler.scheduledTasks}</li>
                            <li><strong>Próximo respaldo:</strong> ${status.scheduler.nextBackup}</li>
                        </ul>
                    </div>
                </div>
            `;
            
            showModal('Estado del Sistema', statusHtml, 'info');
        } else {
            showNotification('Error obteniendo estado del sistema', 'error');
        }
    } catch (error) {
        console.error('Error obteniendo estado del sistema:', error);
        showNotification('Error de conexión', 'error');
    }
}

/**
 * Crear respaldo del sistema
 */
async function createBackup() {
    try {
        showNotification('Creando respaldo...', 'info');
        
        const response = await fetch('/api/backup', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification(`Respaldo creado: ${data.backupPath}`, 'success');
        } else {
            showNotification('Error creando respaldo', 'error');
        }
    } catch (error) {
        console.error('Error creando respaldo:', error);
        showNotification('Error de conexión', 'error');
    }
}

/**
 * Reiniciar sistema
 */
async function restartSystem() {
    showConfirmDialog('¿Está seguro de que desea reiniciar el sistema? Esta acción puede tomar varios segundos.', async () => {
        try {
            showNotification('Reiniciando sistema...', 'warning');
            
            const response = await fetch('/api/system/control', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'restart_scheduler'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification('Sistema reiniciado correctamente', 'success');
                setTimeout(() => {
                    location.reload();
                }, 2000);
            } else {
                showNotification('Error reiniciando sistema', 'error');
            }
        } catch (error) {
            console.error('Error reiniciando sistema:', error);
            showNotification('Error de conexión', 'error');
        }
    });
}

/**
 * Mostrar modal personalizado
 */
function showModal(title, content, type = 'info') {
    // Crear modal dinámicamente
    const modalHtml = `
        <div class="modal fade" id="customModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-${type} text-white">
                        <h5 class="modal-title">${title}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal existente si hay uno
    const existingModal = document.getElementById('customModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Agregar nuevo modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('customModal'));
    modal.show();
    
    // Limpiar modal cuando se cierre
    document.getElementById('customModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

/**
 * Formatear uptime
 */
function formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

/**
 * Formatear bytes
 */
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Formatear fecha
 */
function formatDate(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Formatear tiempo relativo
 */
function formatRelativeTime(date) {
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return `hace ${days} día${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
        return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
        return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else {
        return 'ahora mismo';
    }
}

/**
 * Validar formulario
 */
function validateForm(formElement) {
    const inputs = formElement.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('is-invalid');
            isValid = false;
        } else {
            input.classList.remove('is-invalid');
        }
    });
    
    return isValid;
}

/**
 * Limpiar formulario
 */
function clearForm(formElement) {
    const inputs = formElement.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.value = '';
        input.classList.remove('is-invalid', 'is-valid');
    });
}

/**
 * Ejecutar acción
 */
function executeAction(action, element) {
    switch (action) {
        case 'delete':
            if (element.dataset.id) {
                deleteItem(element.dataset.id);
            }
            break;
        case 'edit':
            if (element.dataset.id) {
                editItem(element.dataset.id);
            }
            break;
        case 'toggle':
            if (element.dataset.id) {
                toggleItem(element.dataset.id);
            }
            break;
        default:
            console.log('Acción no reconocida:', action);
    }
}

/**
 * Iniciar actualizaciones de estado
 */
function startStatusUpdates() {
    // Actualizar estado del sistema cada 30 segundos
    setInterval(async () => {
        try {
            const response = await fetch('/api/system/status');
            const data = await response.json();
            
            if (data.success) {
                systemStatus.uptime = data.status.uptime;
                systemStatus.lastUpdate = new Date();
                
                // Actualizar indicador de estado en navbar
                updateNavbarStatus(data.status);
            }
        } catch (error) {
            console.error('Error actualizando estado:', error);
            systemStatus.online = false;
        }
    }, 30000);
}

/**
 * Actualizar estado en navbar
 */
function updateNavbarStatus(status) {
    const statusIndicator = document.querySelector('.navbar-nav .dropdown-toggle');
    
    if (statusIndicator) {
        const isOnline = status.gpio.gpioInitialized && status.scheduler.isRunning;
        
        if (isOnline) {
            statusIndicator.innerHTML = '<i class="bi bi-circle-fill text-success me-1"></i>Sistema Online';
            systemStatus.online = true;
        } else {
            statusIndicator.innerHTML = '<i class="bi bi-circle-fill text-danger me-1"></i>Sistema Offline';
            systemStatus.online = false;
        }
    }
}

/**
 * Función de utilidad para hacer peticiones HTTP
 */
async function apiRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error en la petición');
        }
        
        return data;
    } catch (error) {
        console.error('Error en petición API:', error);
        throw error;
    }
}

/**
 * Función para mostrar errores de API
 */
function showApiError(error, fallbackMessage = 'Error en la operación') {
    const message = error.message || fallbackMessage;
    showNotification(message, 'error');
}

/**
 * Función para mostrar éxito de API
 */
function showApiSuccess(message) {
    showNotification(message, 'success');
}

// Exportar funciones para uso global
window.HidroSystem = {
    showNotification,
    showConfirmDialog,
    showModal,
    formatDate,
    formatRelativeTime,
    formatUptime,
    formatBytes,
    validateForm,
    clearForm,
    apiRequest,
    showApiError,
    showApiSuccess
}; 