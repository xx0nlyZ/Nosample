(function () {
    'use strict';

    function initials(name) {
        return String(name || '').split(/\s+/).filter(function (p) { return p; })
            .slice(0, 2).map(function (p) { return p[0].toUpperCase(); })
            .join('') || 'A';
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (typeof API === 'undefined') return;

        API.get('/admin/profile').then(function (profile) {
            var p = profile || {};
            var fullName = p.fullName || '';
            var role = p.role || 'Administrator';

            var avatars = document.querySelectorAll('.profile-avatar');
            avatars.forEach(function (el) { el.textContent = initials(fullName) || 'A'; });

            var nameEls = document.querySelectorAll('.profile-info strong');
            nameEls.forEach(function (el) { if (fullName) el.textContent = fullName; });

            var roleEls = document.querySelectorAll('.profile-info small');
            roleEls.forEach(function (el) { if (role) el.textContent = role; });
        }).catch(function () {
            /* no-op: keep the static fallback identity */
        });
    });
})();