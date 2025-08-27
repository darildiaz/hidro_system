/**
 * JavaScript Principal del Sistema de Hidroponía
 * Funciones comunes y utilidades
 * Ing. Daril Díaz - 2024
 */

// ===== FUNCIONES UTILITARIAS DEL SISTEMA AUTO HIDRO =====

// ===== FORZAR PROTOCOLO HTTP =====
function forceHttpProtocol() {
    // Redirigir inmediatamente si estamos en HTTPS
    if (window.location.protocol === 'https:') {
        const newUrl = window.location.href.replace('https:', 'http:');
        window.location.replace(newUrl);
        return;
    }
    
    // Verificar que todos los enlaces sean HTTP
    document.querySelectorAll('a[href]').forEach(link => {
        if (link.href.startsWith('https:')) {
            link.href = link.href.replace('https:', 'http:');
        }
    });
    
    // Verificar que todos los formularios sean HTTP
    document.querySelectorAll('form[action]').forEach(form => {
        if (form.action.startsWith('https:')) {
            form.action = form.action.replace('https:', 'http:');
        }
    });
}

// ===== PREVENIR ENLACES HTTPS =====
function preventHttpsLinks() {
    // Prevenir enlaces HTTPS
    document.addEventListener('click', function(e) {
        if (e.target.tagName === 'A' && e.target.href && e.target.href.startsWith('https:')) {
            e.preventDefault();
            e.target.href = e.target.href.replace('https:', 'http:');
            e.target.click();
        }
    });

    // Prevenir formularios HTTPS
    document.addEventListener('submit', function(e) {
        if (e.target.action && e.target.action.startsWith('https:')) {
            e.preventDefault();
            e.target.action = e.target.action.replace('https:', 'http:');
            e.target.submit();
        }
    });

    // Interceptar todas las peticiones fetch para forzar HTTP
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        if (typeof url === 'string' && url.startsWith('https:')) {
            url = url.replace('https:', 'http:');
        }
        return originalFetch(url, options);
    };

    // Interceptar todas las peticiones XMLHttpRequest para forzar HTTP
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
        if (typeof url === 'string' && url.startsWith('https:')) {
            url = url.replace('https:', 'http:');
        }
        return originalXHROpen.call(this, method, url, ...args);
    };

    // Observar cambios en el DOM para interceptar nuevos enlaces
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        // Verificar enlaces
                        if (node.tagName === 'A' && node.href && node.href.startsWith('https:')) {
                            node.href = node.href.replace('https:', 'http:');
                        }
                        // Verificar formularios
                        if (node.tagName === 'FORM' && node.action && node.action.startsWith('https:')) {
                            node.action = node.action.replace('https:', 'http:');
                        }
                        // Verificar elementos hijos
                        const links = node.querySelectorAll ? node.querySelectorAll('a[href]') : [];
                        const forms = node.querySelectorAll ? node.querySelectorAll('form[action]') : [];
                        
                        links.forEach(link => {
                            if (link.href.startsWith('https:')) {
                                link.href = link.href.replace('https:', 'http:');
                            }
                        });
                        
                        forms.forEach(form => {
                            if (form.action.startsWith('https:')) {
                                form.action = form.action.replace('https:', 'http:');
                            }
                        });
                    }
                });
            }
        });
    });

    // Iniciar observación
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// ===== INICIALIZAR TOOLTIPS =====
function initTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl, {
            trigger: 'hover',
            placement: 'bottom',
            animation: true
        });
    });
}

// ===== FUNCIÓN DE CERRAR SESIÓN =====
function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        showNotification('Cerrando sesión...', 'warning');
        setTimeout(() => {
            // Aquí puedes agregar lógica de limpieza de sesión
            window.location.reload();
        }, 1500);
    }
}

// ===== SISTEMA DE NOTIFICACIONES =====
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// ===== FUNCIONES DE UTILIDAD =====
function formatTime(date) {
    return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function formatDate(date) {
    return date.toLocaleDateString('es-ES');
}

function formatDateTime(date) {
    return `${formatDate(date)} ${formatTime(date)}`;
}

// ===== VALIDACIONES =====
function validateTime(timeString) {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeString);
}

function validateDuration(duration) {
    return duration >= 1 && duration <= 1440;
}

function validateThreshold(value) {
    return !isNaN(value) && value > 0;
}

// ===== FUNCIONES DE API =====
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(endpoint, options);
        return await response.json();
    } catch (error) {
        console.error('Error en API call:', error);
        throw error;
    }
}

// ===== MANEJO DE ERRORES =====
function handleError(error, context = '') {
    console.error(`Error en ${context}:`, error);
    
    let message = 'Ha ocurrido un error inesperado';
    
    if (error.message) {
        message = error.message;
    } else if (error.error) {
        message = error.error;
    }
    
    showNotification(message, 'error');
}

// ===== FUNCIONES DE FORMATO =====
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatPercentage(value, total) {
    if (total === 0) return '0%';
    return Math.round((value / total) * 100) + '%';
}

// ===== FUNCIONES DE FECHA Y HORA =====
function getCurrentTime() {
    return new Date();
}

function getTimeDifference(start, end) {
    const diff = end - start;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return `${days} día(s), ${hours % 24} hora(s)`;
    } else if (hours > 0) {
        return `${hours} hora(s), ${minutes % 60} minuto(s)`;
    } else {
        return `${minutes} minuto(s)`;
    }
}

// ===== FUNCIONES DE VALIDACIÓN DE FORMULARIOS =====
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

function clearFormValidation(formElement) {
    const inputs = formElement.querySelectorAll('.is-invalid');
    inputs.forEach(input => {
        input.classList.remove('is-invalid');
    });
}

// ===== FUNCIONES DE ANIMACIÓN =====
function fadeIn(element, duration = 300) {
    element.style.opacity = '0';
    element.style.display = 'block';
    
    let start = null;
    function animate(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        const opacity = Math.min(progress / duration, 1);
        
        element.style.opacity = opacity;
        
        if (progress < duration) {
            requestAnimationFrame(animate);
        }
    }
    
    requestAnimationFrame(animate);
}

function fadeOut(element, duration = 300) {
    let start = null;
    function animate(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        const opacity = Math.max(1 - (progress / duration), 0);
        
        element.style.opacity = opacity;
        
        if (progress < duration) {
            requestAnimationFrame(animate);
        } else {
            element.style.display = 'none';
        }
    }
    
    requestAnimationFrame(animate);
}

// ===== FUNCIONES DE LOCAL STORAGE =====
function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error guardando en localStorage:', error);
    }
}

function getFromLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error leyendo de localStorage:', error);
        return defaultValue;
    }
}

function removeFromLocalStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Error removiendo de localStorage:', error);
    }
}

// ===== FUNCIONES DE COOKIES =====
function setCookie(name, value, days = 7) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function deleteCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
}

// ===== INICIALIZACIÓN CUANDO EL DOM ESTÉ LISTO =====
document.addEventListener('DOMContentLoaded', function() {
    // Forzar protocolo HTTP
    forceHttpProtocol();
    
    // Prevenir enlaces HTTPS
    preventHttpsLinks();
    
    // Inicializar tooltips
    initTooltips();
    
    console.log('Sistema AutoHidro inicializado correctamente');
});

// ===== EXPORTAR FUNCIONES PARA USO GLOBAL =====
window.AutoHidroUtils = {
    forceHttpProtocol,
    preventHttpsLinks,
    initTooltips,
    logout,
    showNotification,
    formatTime,
    formatDate,
    formatDateTime,
    validateTime,
    validateDuration,
    validateThreshold,
    apiCall,
    handleError,
    formatBytes,
    formatPercentage,
    getCurrentTime,
    getTimeDifference,
    validateForm,
    clearFormValidation,
    fadeIn,
    fadeOut,
    saveToLocalStorage,
    getFromLocalStorage,
    removeFromLocalStorage,
    setCookie,
    getCookie,
    deleteCookie
}; 