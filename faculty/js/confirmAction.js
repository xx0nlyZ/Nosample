(function () {
    'use strict';

    if (window.__CECConfirmAction) return;
    window.__CECConfirmAction = true;

    function confirmAction(el) {
        var msg = el.getAttribute('data-confirm') || 'Are you sure?';
        if (window.confirm(msg)) {
            window.showToast('Action confirmed', 'success');
            if (el.getAttribute('href')) {
                window.location.href = el.href;
            }
        } else {
            window.showToast('Action cancelled', 'info');
        }
    }

    document.addEventListener('click', function (event) {
        var el = event.target.closest('[data-confirm]');
        if (!el) return;
        event.preventDefault();
        confirmAction(el);
    });
})();