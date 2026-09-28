(function (global) {
    'use strict';

    function initials(name) {
        return String(name || '')
            .split(/\s+/)
            .filter(function (word) { return /[A-Za-z]/.test(word); })
            .map(function (word) { return word.charAt(0); })
            .slice(0, 2)
            .join('')
            .toUpperCase();
    }

    function apply(profile) {
        if (!profile) return;
        var name = profile.fullName || profile.name || '';
        if (!name) return;
        var nameEl = document.querySelector('.profile-info strong');
        var avatarEl = document.querySelector('.profile-avatar');
        if (nameEl) nameEl.textContent = name;
        if (avatarEl) {
            var abbr = initials(name);
            if (abbr) avatarEl.textContent = abbr;
        }
    }

    function load() {
        if (!global.API) return;
        global.API.get('/faculty/profile').then(function (res) {
            apply((res && res.data) ? res.data : res);
        }).catch(function () {});
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', load);
    } else {
        load();
    }

    global.FacultyIdentity = { apply: apply, load: load };
})(window);
