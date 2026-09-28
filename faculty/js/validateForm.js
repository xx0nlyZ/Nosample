(function () {
    'use strict';

    if (window.__CECValidateForm) return;
    window.__CECValidateForm = true;

    function clearError(field) {
        field.classList.remove('cec-field-error');
        var msg = field.nextElementSibling;
        if (msg && msg.classList && msg.classList.contains('cec-error-msg')) {
            msg.remove();
        }
    }

    function isFieldValid(field) {
        return field.type === 'checkbox' ? field.checked : Boolean(field.value.trim());
    }

    function validateForm(form) {
        var firstInvalid = null;
        var required = form.querySelectorAll('[required]');
        Array.prototype.forEach.call(required, function (field) {
            clearError(field);
            if (isFieldValid(field)) return;
            field.classList.add('cec-field-error');
            var span = document.createElement('span');
            span.className = 'cec-error-msg';
            span.textContent = 'This field is required';
            field.parentNode.insertBefore(span, field.nextSibling);
            if (!firstInvalid) firstInvalid = field;
        });
        return firstInvalid;
    }

    document.addEventListener('submit', function (event) {
        var form = event.target;
        if (!form.matches('[data-faculty-form]')) return;

        event.preventDefault();
        var firstInvalid = validateForm(form);
        if (firstInvalid) {
            window.showToast('Please fill out the highlighted fields', 'error');
            firstInvalid.focus();
            return;
        }

        window.showToast(form.getAttribute('data-success-message') || 'Changes saved successfully', 'success');
        form.reset();
    });

    document.addEventListener('input', function (event) {
        clearError(event.target);
    });
})();