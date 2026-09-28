(function () {
    'use strict';

    if (window.__CECCopyToClipboard) return;
    window.__CECCopyToClipboard = true;

    function copyToClipboard(value) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(value).then(function () {
                window.showToast('Copied to clipboard', 'info');
            }, function () {
                legacyCopy(value);
            });
        } else {
            legacyCopy(value);
        }
    }

    function legacyCopy(value) {
        var ta = document.createElement('textarea');
        ta.value = value;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            window.showToast('Copied to clipboard', 'info');
        } catch (err) {
            window.showToast('Could not copy', 'error');
        }
        document.body.removeChild(ta);
    }

    document.addEventListener('click', function (event) {
        var el = event.target.closest('[data-copy]');
        if (!el) return;
        event.preventDefault();
        copyToClipboard(el.getAttribute('data-copy') || el.textContent.trim());
    });
})();