/* CEC Admin Portal - Session Management */

(function () {
    'use strict';

    try {
        var timeoutSelect = document.getElementById('timeout-select');
        if (timeoutSelect) {
            timeoutSelect.addEventListener('change', function () {
                localStorage.setItem('cec-session-timeout', this.value);
            });
            var stored = localStorage.getItem('cec-session-timeout');
            if (stored && [...timeoutSelect.options].some(function (o) { return o.value === stored; })) {
                timeoutSelect.value = stored;
            }
        }
    } catch (err) {
        /* ignore storage errors */
    }
})();