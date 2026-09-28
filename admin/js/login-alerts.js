/* CEC Admin Portal - Login Alert Preferences */

(function () {
    'use strict';

    function showToast(message, isError) {
        var toast = document.createElement('div');
        toast.className = 'toast show ' + (isError ? 'toast-error' : 'toast-success');
        toast.innerHTML = '<i class="fa-solid ' + (isError ? 'fa-circle-exclamation' : 'fa-circle-check') + '"></i> ' + message;
        document.body.appendChild(toast);
        setTimeout(function () {
            toast.classList.remove('show');
            setTimeout(function () {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 2800);
    }

    var checkboxes = ['alert-new-device', 'alert-unfamiliar-location', 'alert-every-activity'];
    var emailInput = document.getElementById('alert-email');

    function persist() {
        var state = {};
        checkboxes.forEach(function (id) {
            var el = document.getElementById(id);
            state[id] = el ? el.checked : false;
        });
        if (emailInput) state.email = emailInput.value;
        localStorage.setItem('cec-login-alerts', JSON.stringify(state));
    }

    try {
        var saved = localStorage.getItem('cec-login-alerts');
        if (saved) {
            var state = JSON.parse(saved);
            checkboxes.forEach(function (id) {
                var el = document.getElementById(id);
                if (el && typeof state[id] === 'boolean') el.checked = state[id];
            });
            if (emailInput && state.email) emailInput.value = state.email;
        }
    } catch (err) {
        /* ignore storage errors */
    }

    document.getElementById('save-alerts-btn').addEventListener('click', function () {
        var email = emailInput.value.trim();
        if (!email || email.indexOf('@') === -1) {
            showToast('Please enter a valid email address.', true);
            return;
        }
        persist();
        showToast('Alert preferences saved.');
    });
})();