(function () {
    'use strict';

    if (window.__CECShowToast) return;
    window.__CECShowToast = true;

    var wrap = null;
    var stylesInjected = false;

    function injectStyles() {
        if (stylesInjected) return;
        stylesInjected = true;
        if (document.getElementById('cec-faculty-js-styles')) return;
        var style = document.createElement('style');
        style.id = 'cec-faculty-js-styles';
        style.textContent = '' +
            '.cec-toast-wrap{position:fixed;right:20px;bottom:20px;z-index:9999;display:flex;flex-direction:column;gap:10px;pointer-events:none}' +
            '.cec-toast{background:#0B2C5E;color:#fff;padding:12px 18px;border-radius:8px;font-size:14px;line-height:1.4;box-shadow:0 6px 18px rgba(11,44,94,.25);display:flex;align-items:center;gap:10px;transition:opacity .3s ease,transform .3s ease;max-width:340px}' +
            '.cec-toast i{color:#DCE7F5}' +
            '.cec-toast.cec-toast--success{background:#1D9E5B}' +
            '.cec-toast.cec-toast--error{background:#C0392B}' +
            '.cec-toast.cec-toast--info{background:#1D4E9B}' +
            '.cec-copy-btn{background:none;border:none;padding:2px 6px;color:#1D4E9B;cursor:pointer;font-size:13px;vertical-align:middle;border-radius:4px}' +
            '.cec-copy-btn:hover{background:#DCE7F5}' +
            '.cec-copy-btn i{pointer-events:none}' +
            '.cec-field-error{border-color:#C0392B !important;background:#FFF5F5 !important}' +
            '.cec-error-msg{color:#C0392B;font-size:12px;margin-top:4px;display:block}';
        document.head.appendChild(style);
    }

    function showToast(message, type) {
        injectStyles();
        if (!wrap || !document.body.contains(wrap)) {
            wrap = document.createElement('div');
            wrap.className = 'cec-toast-wrap';
            wrap.setAttribute('aria-live', 'polite');
            document.body.appendChild(wrap);
        }
        var toast = document.createElement('div');
        toast.className = 'cec-toast' + (type ? ' cec-toast--' + type : '');
        toast.setAttribute('role', 'status');
        toast.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
        toast.insertAdjacentText('beforeend', message);
        wrap.appendChild(toast);
        while (wrap.children.length > 4) {
            wrap.removeChild(wrap.firstElementChild);
        }
        setTimeout(function () {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(8px)';
            setTimeout(function () { toast.remove(); }, 300);
        }, 2800);
    }

    window.showToast = showToast;

    document.addEventListener('click', function (event) {
        var btn = event.target.closest('[data-toast-onclick]');
        if (!btn) return;
        event.preventDefault();
        showToast(btn.getAttribute('data-toast-onclick'), btn.getAttribute('data-toast-type') || 'success');
    });
})();