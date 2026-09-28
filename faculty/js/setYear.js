(function () {
    'use strict';

    if (window.__CECSetYear) return;
    window.__CECSetYear = true;

    function setYear() {
        var year = String(new Date().getFullYear());
        var els = document.querySelectorAll('[data-year]');
        Array.prototype.forEach.call(els, function (el) {
            el.textContent = year;
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setYear);
    } else {
        setYear();
    }
})();