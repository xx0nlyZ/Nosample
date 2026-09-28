/* CEC Admin Portal - Notification Settings */

(function () {
    'use strict';

    var keys = {
        'noti-enrollment': 'cec-noti-enrollment',
        'noti-documents': 'cec-noti-documents',
        'noti-system': 'cec-noti-system'
    };

    try {
        Object.keys(keys).forEach(function (id) {
            var el = document.getElementById(id);
            if (!el) return;
            var stored = localStorage.getItem(keys[id]);
            if (stored !== null) el.checked = stored === 'true';
            el.addEventListener('change', function () {
                localStorage.setItem(keys[id], el.checked);
            });
        });
    } catch (err) {
        /* ignore storage errors */
    }
})();