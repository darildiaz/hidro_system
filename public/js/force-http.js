// ===== SCRIPT AGRESIVO PARA FORZAR HTTP =====
// Este script se ejecuta antes que cualquier otro para prevenir HTTPS

(function() {
    'use strict';
    
    console.log('🚀 Iniciando forzado agresivo de HTTP...');
    
    // ===== INTERCEPTAR URLS ANTES DE QUE SE EJECUTEN =====
    
    // Interceptar window.location antes de que se use
    const originalLocation = window.location;
    const originalHref = Object.getOwnPropertyDescriptor(window.location, 'href');
    
    Object.defineProperty(window.location, 'href', {
        get: function() {
            return originalLocation.href;
        },
        set: function(value) {
            if (typeof value === 'string' && value.startsWith('https:')) {
                console.log('🚫 Bloqueando cambio de location a HTTPS:', value);
                value = value.replace('https:', 'http:');
            }
            return originalHref.set.call(this, value);
        }
    });
    
    // Interceptar window.location.replace
    const originalReplace = window.location.replace;
    window.location.replace = function(url) {
        if (typeof url === 'string' && url.startsWith('https:')) {
            console.log('🚫 Bloqueando location.replace a HTTPS:', url);
            url = url.replace('https:', 'http:');
        }
        return originalReplace.call(this, url);
    };
    
    // Interceptar window.location.assign
    const originalAssign = window.location.assign;
    window.location.assign = function(url) {
        if (typeof url === 'string' && url.startsWith('https:')) {
            console.log('🚫 Bloqueando location.assign a HTTPS:', url);
            url = url.replace('https:', 'http:');
        }
        return originalAssign.call(this, url);
    };
    
    // ===== INTERCEPTAR TODAS LAS PETICIONES HTTP =====
    
    // Interceptar fetch de manera más agresiva
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        let processedUrl = url;
        
        if (typeof url === 'string') {
            // Convertir URLs relativas a absolutas con HTTP
            if (url.startsWith('/')) {
                processedUrl = `http://${window.location.host}${url}`;
                console.log('🔧 Convirtiendo URL relativa a HTTP absoluta:', url, '→', processedUrl);
            } else if (url.startsWith('https:')) {
                processedUrl = url.replace('https:', 'http:');
                console.log('🔧 Convirtiendo HTTPS a HTTP en fetch:', url, '→', processedUrl);
            }
        }
        
        return originalFetch(processedUrl, options);
    };
    
    // Interceptar XMLHttpRequest de manera más agresiva
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
        let processedUrl = url;
        
        if (typeof url === 'string') {
            // Convertir URLs relativas a absolutas con HTTP
            if (url.startsWith('/')) {
                processedUrl = `http://${window.location.host}${url}`;
                console.log('🔧 Convirtiendo URL relativa a HTTP absoluta en XHR:', url, '→', processedUrl);
            } else if (url.startsWith('https:')) {
                processedUrl = url.replace('https:', 'http:');
                console.log('🔧 Convirtiendo HTTPS a HTTP en XHR:', url, '→', processedUrl);
            }
        }
        
        return originalXHROpen.call(this, method, processedUrl, ...args);
    };
    
    // ===== FUNCIÓN PRINCIPAL DE FORZADO HTTP =====
    function forceHttpAggressively() {
        // 1. Redirigir inmediatamente si estamos en HTTPS
        if (window.location.protocol === 'https:') {
            console.log('🚫 HTTPS detectado, redirigiendo a HTTP...');
            const newUrl = window.location.href.replace('https:', 'http:');
            window.location.replace(newUrl);
            return;
        }
        
        // 2. Verificar y corregir todos los enlaces existentes
        document.querySelectorAll('a[href]').forEach(link => {
            if (link.href.startsWith('https:')) {
                console.log('🔧 Corrigiendo enlace HTTPS:', link.href);
                link.href = link.href.replace('https:', 'http:');
            }
            // También corregir URLs relativas que puedan convertirse a HTTPS
            if (link.href.startsWith('http://192.168.1.39:3000/')) {
                const relativePath = link.href.replace('http://192.168.1.39:3000', '');
                if (relativePath.startsWith('/')) {
                    link.href = `http://192.168.1.39:3000${relativePath}`;
                }
            }
        });
        
        // 3. Verificar y corregir todos los formularios existentes
        document.querySelectorAll('form[action]').forEach(form => {
            if (form.action.startsWith('https:')) {
                console.log('🔧 Corrigiendo formulario HTTPS:', form.action);
                form.action = form.action.replace('https:', 'http:');
            }
        });
        
        // 4. Verificar y corregir todos los scripts existentes
        document.querySelectorAll('script[src]').forEach(script => {
            if (script.src.startsWith('https:')) {
                console.log('🔧 Corrigiendo script HTTPS:', script.src);
                script.src = script.src.replace('https:', 'http:');
            }
        });
        
        // 5. Verificar y corregir todos los estilos existentes
        document.querySelectorAll('link[href]').forEach(link => {
            if (link.href.startsWith('https:')) {
                console.log('🔧 Corrigiendo estilo HTTPS:', link.href);
                link.href = link.href.replace('https:', 'http:');
            }
        });
        
        // 6. Verificar y corregir todas las imágenes existentes
        document.querySelectorAll('img[src]').forEach(img => {
            if (img.src.startsWith('https:')) {
                console.log('🔧 Corrigiendo imagen HTTPS:', img.src);
                img.src = img.src.replace('https:', 'http:');
            }
        });
        
        // 7. Verificar y corregir todas las URLs en atributos data-*
        document.querySelectorAll('[data-url]').forEach(element => {
            const dataUrl = element.getAttribute('data-url');
            if (dataUrl && dataUrl.startsWith('https:')) {
                console.log('🔧 Corrigiendo data-url HTTPS:', dataUrl);
                element.setAttribute('data-url', dataUrl.replace('https:', 'http:'));
            }
        });
    }
    
    // ===== OBSERVAR CAMBIOS EN EL DOM =====
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        // Verificar enlaces
                        if (node.tagName === 'A' && node.href && node.href.startsWith('https:')) {
                            console.log('🔧 Corrigiendo nuevo enlace HTTPS:', node.href);
                            node.href = node.href.replace('https:', 'http:');
                        }
                        
                        // Verificar formularios
                        if (node.tagName === 'FORM' && node.action && node.action.startsWith('https:')) {
                            console.log('🔧 Corrigiendo nuevo formulario HTTPS:', node.action);
                            node.action = node.action.replace('https:', 'http:');
                        }
                        
                        // Verificar scripts
                        if (node.tagName === 'SCRIPT' && node.src && node.src.startsWith('https:')) {
                            console.log('🔧 Corrigiendo nuevo script HTTPS:', node.src);
                            node.src = node.src.replace('https:', 'http:');
                        }
                        
                        // Verificar estilos
                        if (node.tagName === 'LINK' && node.href && node.href.startsWith('https:')) {
                            console.log('🔧 Corrigiendo nuevo estilo HTTPS:', node.href);
                            node.href = node.href.replace('https:', 'http:');
                        }
                        
                        // Verificar imágenes
                        if (node.tagName === 'IMG' && node.src && node.src.startsWith('https:')) {
                            console.log('🔧 Corrigiendo nueva imagen HTTPS:', node.src);
                            node.src = node.src.replace('https:', 'http:');
                        }
                        
                        // Verificar elementos hijos
                        const links = node.querySelectorAll ? node.querySelectorAll('a[href]') : [];
                        const forms = node.querySelectorAll ? node.querySelectorAll('form[action]') : [];
                        const scripts = node.querySelectorAll ? node.querySelectorAll('script[src]') : [];
                        const styles = node.querySelectorAll ? node.querySelectorAll('link[href]') : [];
                        const images = node.querySelectorAll ? node.querySelectorAll('img[src]') : [];
                        
                        links.forEach(link => {
                            if (link.href.startsWith('https:')) {
                                console.log('🔧 Corrigiendo enlace hijo HTTPS:', link.href);
                                link.href = link.href.replace('https:', 'http:');
                            }
                        });
                        
                        forms.forEach(form => {
                            if (form.action.startsWith('https:')) {
                                console.log('🔧 Corrigiendo formulario hijo HTTPS:', form.action);
                                form.action = form.action.replace('https:', 'http:');
                            }
                        });
                        
                        scripts.forEach(script => {
                            if (script.src.startsWith('https:')) {
                                console.log('🔧 Corrigiendo script hijo HTTPS:', script.src);
                                script.src = script.src.replace('https:', 'http:');
                            }
                        });
                        
                        styles.forEach(style => {
                            if (style.href.startsWith('https:')) {
                                console.log('🔧 Corrigiendo estilo hijo HTTPS:', style.href);
                                style.href = style.href.replace('https:', 'http:');
                            }
                        });
                        
                        images.forEach(img => {
                            if (img.src.startsWith('https:')) {
                                console.log('🔧 Corrigiendo imagen hija HTTPS:', img.src);
                                img.src = img.src.replace('https:', 'http:');
                            }
                        });
                    }
                });
            }
        });
    });
    
    // ===== INICIALIZACIÓN =====
    
    // Ejecutar inmediatamente
    forceHttpAggressively();
    
    // Ejecutar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', forceHttpAggressively);
    } else {
        forceHttpAggressively();
    }
    
    // Ejecutar cuando la página esté completamente cargada
    window.addEventListener('load', forceHttpAggressively);
    
    // Iniciar observación del DOM
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Ejecutar cada 50ms durante los primeros 10 segundos
    let forceCount = 0;
    const forceInterval = setInterval(() => {
        forceHttpAggressively();
        forceCount++;
        if (forceCount >= 200) { // 10 segundos
            clearInterval(forceInterval);
            console.log('✅ Forzado agresivo de HTTP completado');
        }
    }, 50);
    
    // Ejecutar cada segundo indefinidamente
    setInterval(forceHttpAggressively, 1000);
    
    console.log('✅ Script de forzado agresivo de HTTP cargado');
    
})(); 