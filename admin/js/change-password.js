/* CEC Admin Portal - Change Password */

(function () {
    'use strict';

    var strengthMap = [
        { label: 'Weak', klass: 'weak', segs: 1 },
        { label: 'Weak', klass: 'weak', segs: 1 },
        { label: 'Medium', klass: 'medium', segs: 2 },
        { label: 'Strong', klass: 'strong', segs: 4 }
    ];

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

    function evaluateStrength(value) {
        var score = 0;
        if (!value) return strengthMap[0];
        if (value.length >= 8) score++;
        if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
        if (/\d/.test(value)) score++;
        if (/[^A-Za-z0-9]/.test(value)) score++;
        if (score >= 3) score = 3;
        return strengthMap[score];
    }

    var newPassword = document.getElementById('new-password');
    var meter = document.getElementById('strength-meter');
    var statusEl = document.getElementById('strength-status');
    var textEl = document.getElementById('strength-text');

    if (newPassword && meter && statusEl && textEl) {
        newPassword.addEventListener('input', function () {
            var result = evaluateStrength(this.value);
            var segs = meter.querySelectorAll('.strength-seg');
            segs.forEach(function (seg, i) {
                seg.className = 'strength-seg';
                if (i < result.segs) seg.classList.add(result.klass === 'weak' ? 'weak-fill' : result.klass === 'medium' ? 'medium-fill' : 'strong-fill');
            });
            statusEl.className = 'strength-status ' + result.klass;
            statusEl.textContent = result.label;
            textEl.textContent = result.label;
        });
    }

    document.querySelectorAll('.pw-toggle').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var input = document.getElementById(this.getAttribute('data-toggle'));
            if (!input) return;
            var show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            this.innerHTML = '<i class="fa-regular ' + (show ? 'fa-eye' : 'fa-eye-slash') + '"></i>';
        });
    });

    var form = document.getElementById('password-form');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var current = document.getElementById('current-password').value;
            var newPw = document.getElementById('new-password').value;
            var confirmPw = document.getElementById('confirm-password').value;

            if (!current || !newPw || !confirmPw) {
                showToast('Please fill in all password fields.', true);
                return;
            }
            if (newPw !== confirmPw) {
                showToast('New password and confirmation do not match.', true);
                return;
            }

            var btn = document.getElementById('update-btn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Updating...';
            setTimeout(function () {
                btn.disabled = false;
                btn.innerHTML = '<i class="fa-solid fa-lock"></i> Update Password';
                showToast('Password updated successfully.');
                form.reset();
                statusEl.className = 'strength-status weak';
                statusEl.textContent = 'Weak';
                textEl.textContent = 'Weak';
                meter.querySelectorAll('.strength-seg').forEach(function (seg, i) {
                    seg.className = 'strength-seg';
                    if (i === 0) seg.classList.add('weak-fill');
                });
            }, 1000);
        });
    }
})();