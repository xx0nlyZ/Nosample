(function (global) {
    'use strict';

    function escText(value) {
        var div = document.createElement('div');
        div.textContent = String(value == null ? '' : value);
        return div.innerHTML;
    }

    function initials(name) {
        return String(name).split(/\s+/).filter(Boolean).slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase();
    }

    function applyProfile(user) {
        if (!user || typeof user !== 'object') return;
        var name = user.name || user.fullName || '';
        if (!name) return;
        var av = document.querySelector('.app-user-avatar');
        var strong = document.querySelector('.app-user-text strong');
        var small = document.querySelector('.app-user-text small');
        if (av) av.textContent = initials(name);
        if (strong) strong.textContent = escText(name);
        if (small && !small.textContent) small.textContent = escText(user.role || 'Student');
    }

    function load() {
        if (!global.API) return;
        global.API.get('/student/profile').then(function (res) {
            var p = res && res.data && typeof res.data === 'object' ? res.data : res;
            applyProfile(p);
        }).catch(function () {});
    }

    if (global.API) {
        load();
    } else {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            load();
        } else {
            document.addEventListener('DOMContentLoaded', load);
        }
    }
})(window);
