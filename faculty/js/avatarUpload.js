(function () {
    'use strict';

    if (window.__CECAvatarUpload) return;
    window.__CECAvatarUpload = true;

    function previewImage(preview, url) {
        if (!preview) return;
        if (preview.tagName === 'IMG') {
            preview.src = url;
        } else {
            preview.style.backgroundImage = 'url("' + url + '")';
            preview.style.backgroundSize = 'cover';
            preview.style.backgroundPosition = 'center';
            preview.textContent = '';
        }
    }

    document.addEventListener('click', function (event) {
        var trigger = event.target.closest('[data-avatar-trigger]');
        if (!trigger) return;
        event.preventDefault();
        var targetSelector = trigger.getAttribute('data-avatar-target');
        var input = targetSelector ? document.querySelector(targetSelector) : document.querySelector('[data-avatar-input]');
        if (input) input.click();
    });

    document.addEventListener('change', function (event) {
        var input = event.target;
        if (!input.matches('[data-avatar-input]')) return;

        var file = input.files && input.files[0];
        if (!file) return;
        if (!/^image\//.test(file.type)) {
            window.showToast('Please choose an image file', 'error');
            return;
        }

        var reader = new FileReader();
        reader.onload = function (e) {
            previewImage(document.querySelector('[data-avatar-preview]'), e.target.result);
            window.showToast('Profile photo updated', 'success');
        };
        reader.readAsDataURL(file);
        input.value = '';
    });
})();