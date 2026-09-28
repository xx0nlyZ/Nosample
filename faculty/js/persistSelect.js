(function () {
    'use strict';

    if (window.__CECPersistSelect) return;
    window.__CECPersistSelect = true;

    function storageKey(el) {
        return el.getAttribute('data-persist') || 'cec:semester:' + location.pathname;
    }

    function saveValue(el) {
        var key = storageKey(el);
        try {
            if (el.tagName === 'SELECT' && el.selectedIndex >= 0) {
                localStorage.setItem(key, String(el.selectedIndex));
            } else {
                localStorage.setItem(key, el.value);
            }
        } catch (err) {}
    }

    function restoreValue(el) {
        var stored = null;
        try { stored = localStorage.getItem(storageKey(el)); } catch (err) {}
        if (stored === null) return;
        if (el.tagName === 'SELECT' && el.options[parseInt(stored, 10)]) {
            el.selectedIndex = parseInt(stored, 10);
        } else if (el.tagName === 'INPUT') {
            el.value = stored;
        }
    }

    document.addEventListener('change', function (event) {
        var el = event.target.closest('[data-persist], .semester-select');
        if (!el || (el.tagName !== 'SELECT' && el.tagName !== 'INPUT')) return;
        saveValue(el);
    });

    document.addEventListener('DOMContentLoaded', function () {
        var els = document.querySelectorAll('[data-persist], .semester-select');
        Array.prototype.forEach.call(els, restoreValue);
    });
})();