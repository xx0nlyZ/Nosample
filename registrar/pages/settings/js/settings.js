/* ==========================================================================
   SETTINGS SPA  |  registrar/settings/js/settings.js
   Single-page behaviour for the Settings module.
   ========================================================================== */

(function () {
    'use strict';

    var ACCENTS = {
        blue: '#1D4E9B',
        purple: '#7C3AED',
        green: '#177245',
        yellow: '#D97706',
        red: '#B3261E'
    };

    var FONT_SIZES = { '14': '14', '16': '16', '18': '18' };

    var historyItems = [];

    var PAGE_SIZE = 5;
    var historyState = { filter: '', status: '', device: '', page: 1 };

    var toastTimer = null;

    function $(sel, ctx) { return (ctx || document).querySelector(sel); }
    function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

    /* --------------------------------------------------------------
       Helpers
       -------------------------------------------------------------- */
    function showToast(message, icon) {
        var toastEl = $('#toast');
        var msgEl = $('#toast-msg');
        if (!toastEl || !msgEl) { return; }
        msgEl.textContent = message;
        toastEl.innerHTML = '<i class="fa-solid ' + (icon || 'fa-check-circle') + '" aria-hidden="true"></i> <span id="toast-msg">' + message + '</span>';
        msgEl = $('#toast-msg');
        toastEl.classList.add('show');
        if (toastTimer) { window.clearTimeout(toastTimer); }
        toastTimer = window.setTimeout(function () {
            toastEl.classList.remove('show');
        }, 2800);
    }

    function escText(value) {
        var div = document.createElement('div');
        div.textContent = String(value == null ? '' : value);
        return div.innerHTML;
    }

    /* --------------------------------------------------------------
       Tab switching (main panels)
       -------------------------------------------------------------- */
    var navLinks = $$('.settings-nav a[data-target]');
    var panels = $$('.settings-panel');

    function activateTab(target) {
        var link = $('.settings-nav a[data-target="' + target + '"]');
        navLinks.forEach(function (a) { a.classList.remove('active'); });
        panels.forEach(function (p) { p.classList.remove('active'); });
        if (link) { link.classList.add('active'); }
        var panel = document.getElementById(target);
        if (panel) {
            panel.classList.add('active');
            /* reset security / history sub-views to their top view */
            if (target === 'panel-security') {
                activateSubView('sec-overview');
            } else if (target === 'panel-history') {
                activateSubView('hist-compact');
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    navLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            activateTab(link.getAttribute('data-target'));
        });
    });

    /* --------------------------------------------------------------
       Security sub-views
       -------------------------------------------------------------- */
    var subViewGroups = {
        'panel-security': ['sec-overview', 'sec-password', 'sec-alerts'],
        'panel-history': ['hist-compact', 'hist-full']
    };

    function activateSubView(viewId) {
        $$('.settings-subview').forEach(function (sv) { sv.classList.remove('active'); });
        var view = document.getElementById(viewId);
        if (view) { view.classList.add('active'); }
    }

    $$('[data-sec-nav]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var viewId = btn.getAttribute('data-sec-nav');
            if (viewId === 'sec-overview') { activateTab('panel-security'); }
            activateSubView(viewId);
        });
    });

    /* --------------------------------------------------------------
       Account panel
       -------------------------------------------------------------- */
    var verifyBadge = $('#verify-badge');
    var btnVerify = $('#btn-verify-email');

    btnVerify.addEventListener('click', function () {
        var email = $('#email-address');
        var value = email.value.trim();
        if (!value || value.indexOf('@') === -1) {
            email.classList.add('invalid');
            showToast('Please enter a valid email address first.', 'fa-triangle-exclamation');
            window.setTimeout(function () { email.classList.remove('invalid'); }, 1800);
            return;
        }
        verifyBadge.classList.add('show');
        btnVerify.textContent = 'Verified';
        btnVerify.style.opacity = '0.7';
        btnVerify.style.cursor = 'default';
        btnVerify.disabled = true;
        showToast('Email address verified successfully.');
    });

    $('#account-form').addEventListener('submit', function (e) {
        e.preventDefault();
        showToast('Account changes saved successfully.');
    });

    var photoInput = $('#photo-input');
    var profilePhoto = $('#profile-photo');

    $('#btn-change-photo').addEventListener('click', function () {
        photoInput.click();
    });

    photoInput.addEventListener('change', function () {
        var file = photoInput.files && photoInput.files[0];
        if (!file) { return; }
        if (file.type.indexOf('image/') !== 0) {
            showToast('Please choose an image file.', 'fa-triangle-exclamation');
            return;
        }
        var reader = new FileReader();
        reader.onload = function (ev) {
            profilePhoto.style.backgroundImage = 'url(' + ev.target.result + ')';
            var icon = profilePhoto.querySelector('i');
            if (icon) { icon.style.display = 'none'; }
            showToast('Profile photo updated.');
        };
        reader.readAsDataURL(file);
    });

    /* --------------------------------------------------------------
       Password strength + change password
       -------------------------------------------------------------- */
    var strengthBar = $('#strength-bar');
    var strengthLabel = $('#strength-label');
    var newPassword = $('#new-password');

    newPassword.addEventListener('input', function () {
        var value = newPassword.value;
        var score = 0;
        if (value.length >= 8) { score += 1; }
        if (/[a-z]/.test(value) && /[A-Z]/.test(value)) { score += 1; }
        if (/\d/.test(value)) { score += 1; }
        if (/[^A-Za-z0-9]/.test(value)) { score += 1; }

        var levels = [
            { label: 'Too weak',            width: '0%',   cls: 'weak' },
            { label: 'Weak',                width: '25%',  cls: 'weak' },
            { label: 'Fair',                width: '50%',  cls: 'fair' },
            { label: 'Good',                width: '75%',  cls: 'good' },
            { label: 'Strong',              width: '100%', cls: 'strong' }
        ];

        strengthBar.className = 'sg-bar ' + levels[score].cls;
        strengthBar.style.width = levels[score].width;
        strengthLabel.textContent = value.length === 0 ? '' : levels[score].label;
        strengthLabel.className = 'strength-label ' + (value.length === 0 ? '' : levels[score].cls);
    });

    $('#password-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var cur = $('#current-password');
        var conf = $('#confirm-password');

        if (!cur.value) {
            cur.classList.add('invalid');
            showToast('Please enter your current password.', 'fa-triangle-exclamation');
            window.setTimeout(function () { cur.classList.remove('invalid'); }, 1800);
            return;
        }
        if (!newPassword.value || newPassword.value.length < 8) {
            showToast('New password must be at least 8 characters long.', 'fa-triangle-exclamation');
            return;
        }
        if (newPassword.value !== conf.value) {
            conf.classList.add('invalid');
            showToast('New passwords do not match.', 'fa-triangle-exclamation');
            window.setTimeout(function () { conf.classList.remove('invalid'); }, 1800);
            return;
        }

        cur.value = '';
        newPassword.value = '';
        conf.value = '';
        strengthBar.style.width = '0%';
        strengthBar.className = 'sg-bar';
        strengthLabel.textContent = '';
        strengthLabel.className = 'strength-label';
        showToast('Password changed successfully.');
    });

    var btnSaveAlerts = $('#btn-save-alerts');
    btnSaveAlerts.addEventListener('click', function () {
        var email = $('#alert-email').value.trim();
        if (!email || email.indexOf('@') === -1) {
            showToast('Please enter a valid target email address.', 'fa-triangle-exclamation');
            return;
        }
        showToast('Login alert preferences saved.');
    });

    /* --------------------------------------------------------------
       Notifications toggles
       -------------------------------------------------------------- */
    $$('#panel-notifications .toggle input').forEach(function (input) {
        input.addEventListener('change', function () {
            var row = input.closest('.option-row');
            var label = row ? row.querySelector('.row-text strong').textContent : 'Notification';
            showToast('"' + label + '" ' + (input.checked ? 'enabled' : 'disabled') + '.');
        });
    });

    /* --------------------------------------------------------------
       Preferences: theme
       -------------------------------------------------------------- */
    var themeCards = $$('.theme-card');

    themeCards.forEach(function (card) {
        card.addEventListener('click', function () {
            themeCards.forEach(function (c) { c.classList.remove('active'); });
            card.classList.add('active');
            var theme = card.getAttribute('data-theme');
            document.body.classList.toggle('theme-dark', theme === 'dark');
            showToast(theme === 'dark' ? 'Dark mode enabled.' : 'Light mode enabled.');
        });
    });

    /* --------------------------------------------------------------
       Preferences: color scheme
       -------------------------------------------------------------- */
    var colorDots = $$('.color-dot');

    colorDots.forEach(function (dot) {
        dot.addEventListener('click', function () {
            colorDots.forEach(function (d) { d.classList.remove('selected'); });
            dot.classList.add('selected');
            var color = dot.getAttribute('data-color');
            document.documentElement.style.setProperty('--blue', ACCENTS[color]);
            document.documentElement.style.setProperty('--primary', ACCENTS[color]);
            showToast('Color scheme changed to ' + color.charAt(0).toUpperCase() + color.slice(1) + '.');
        });
    });

    /* --------------------------------------------------------------
       Preferences: font size
       -------------------------------------------------------------- */
    var fontButtons = $$('#font-size-group button');

    fontButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            fontButtons.forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            document.documentElement.style.setProperty('--font', FONT_SIZES[btn.getAttribute('data-font')] + 'px');
            showToast('Font size changed.');
        });
    });

    /* --------------------------------------------------------------
       Session management
       -------------------------------------------------------------- */
    var timeoutSelect = $('#timeout-select');
    var sessionStatus = $('#session-status');

    timeoutSelect.addEventListener('change', function () {
        var value = timeoutSelect.value;
        if (value === 'never') {
            sessionStatus.textContent = 'Active (No timeout)';
        } else {
            sessionStatus.textContent = 'Active';
        }
        showToast('Session timeout set to ' + timeoutSelect.options[timeoutSelect.selectedIndex].text + '.');
    });

    var lastActive = $('#last-active-time');
    window.setInterval(function () {
        if (lastActive) {
            var d = new Date();
            var h = d.getHours() % 12 || 12;
            var m = d.getMinutes();
            var ampm = d.getHours() >= 12 ? 'PM' : 'AM';
            lastActive.textContent = 'Just now (' + h + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm + ')';
        }
    }, 2000);

    /* --------------------------------------------------------------
       Login history
       -------------------------------------------------------------- */
    $('#btn-view-full-history').addEventListener('click', function () {
        activateSubView('hist-full');
        renderHistory();
    });

    $('#btn-back-history').addEventListener('click', function () {
        activateSubView('hist-compact');
    });

    function filteredHistory() {
        var term = historyState.filter.toLowerCase();
        return historyItems.filter(function (row) {
            var matchTerm = !term ||
                row.date.toLowerCase().indexOf(term) !== -1 ||
                row.device.toLowerCase().indexOf(term) !== -1 ||
                row.ip.toLowerCase().indexOf(term) !== -1 ||
                row.status.toLowerCase().indexOf(term) !== -1 ||
                row.location.toLowerCase().indexOf(term) !== -1;
            var matchStatus = !historyState.status || row.status === historyState.status;
            var matchDevice = !historyState.device || row.device === historyState.device;
            return matchTerm && matchStatus && matchDevice;
        });
    }

    function renderHistory() {
        var body = $('#full-history-body');
        var pagination = $('#hist-pagination');
        var info = $('#hist-pagination-info');
        if (!body) { return; }

        var rows = filteredHistory();
        var totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
        if (historyState.page > totalPages) { historyState.page = totalPages; }

        var start = (historyState.page - 1) * PAGE_SIZE;
        var pageRows = rows.slice(start, start + PAGE_SIZE);

        if (pageRows.length === 0) {
            body.innerHTML = '<tr><td colspan="6" class="empty-cell">No login history matches your filters.</td></tr>';
        } else {
            body.innerHTML = pageRows.map(function (row, i) {
                var statusCls = row.status === 'success' ? 'status-green' : 'status-red';
                var statusText = row.status === 'success' ? 'Success' : 'Failed';
                return '<tr>' +
                    '<td class="muted-cell">' + (start + i + 1) + '</td>' +
                    '<td class="muted-cell">' + escText(row.date) + '</td>' +
                    '<td>' + escText(row.device) + '</td>' +
                    '<td class="muted-cell">' + escText(row.ip) + '</td>' +
                    '<td><span class="status-badge ' + statusCls + '">' + statusText + '</span></td>' +
                    '<td class="muted-cell">' + escText(row.location) + '</td>' +
                    '</tr>';
            }).join('');
        }

        var end = rows.length === 0 ? 0 : Math.min(start + PAGE_SIZE, rows.length);
        info.textContent = rows.length === 0
            ? 'No entries'
            : 'Showing ' + (start + 1) + ' to ' + end + ' of ' + rows.length + ' entries';

        if (totalPages <= 1) {
            pagination.innerHTML = '';
        } else {
            var html = '<button type="button" ' + (historyState.page === 1 ? 'disabled' : '') + ' data-hist-page="' + (historyState.page - 1) + '">&lt;</button>';
            for (var p = 1; p <= totalPages; p += 1) {
                html += '<button type="button" class="' + (historyState.page === p ? 'active' : '') + '" data-hist-page="' + p + '">' + p + '</button>';
            }
            html += '<button type="button" ' + (historyState.page === totalPages ? 'disabled' : '') + ' data-hist-page="' + (historyState.page + 1) + '">&gt;</button>';
            pagination.innerHTML = html;
        }

        $$('#hist-pagination button[data-hist-page]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                historyState.page = parseInt(btn.getAttribute('data-hist-page'), 10);
                renderHistory();
            });
        });
    }

    $('#hist-search').addEventListener('input', function () {
        historyState.filter = this.value;
        historyState.page = 1;
        renderHistory();
    });

    $('#hist-status-filter').addEventListener('change', function () {
        historyState.status = this.value;
        historyState.page = 1;
        renderHistory();
    });

    $('#hist-device-filter').addEventListener('change', function () {
        historyState.device = this.value;
        historyState.page = 1;
        renderHistory();
    });

    $('#btn-export-csv').addEventListener('click', function () {
        var rows = filteredHistory();
        if (rows.length === 0) {
            showToast('Nothing to export for the current filters.', 'fa-triangle-exclamation');
            return;
        }
        var csv = ['#  Date & Time,Device,IP Address,Status,Location'];
        rows.forEach(function (row, i) {
            csv.push((i + 1) + ',"' + row.date + '","' + row.device + '","' + row.ip + '","' + row.status.charAt(0).toUpperCase() + row.status.slice(1) + '","' + row.location + '"');
        });
        var blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'login-history.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        showToast('Login history exported as CSV.');
    });

    /* --------------------------------------------------------------
       Login history data
       -------------------------------------------------------------- */
    function renderCompactHistory() {
        var body = $('#hist-compact tbody');
        if (!body) { return; }
        var rows = historyItems.slice(0, 3);
        if (rows.length === 0) {
            body.innerHTML = '<tr><td colspan="4" class="empty-cell">No login history.</td></tr>';
            return;
        }
        body.innerHTML = rows.map(function (row) {
            var statusCls = row.status === 'success' ? 'status-green' : 'status-red';
            var statusText = row.status === 'success' ? 'Success' : 'Failed';
            return '<tr>' +
                '<td class="muted-cell">' + escText(row.date) + '</td>' +
                '<td>' + escText(row.device) + '</td>' +
                '<td class="muted-cell">' + escText(row.ip) + '</td>' +
                '<td><span class="status-badge ' + statusCls + '">' + statusText + '</span></td>' +
                '</tr>';
        }).join('');
    }

    function loadHistory() {
        if (!window.API) { return; }
        window.API.get('/registrar/login-history').then(function (res) {
            var items = (res && Array.isArray(res)) ? res : ((res && res.data) || []);
            historyItems = items;
            historyState.page = 1;
            renderCompactHistory();
            renderHistory();
        }).catch(function () {
            historyItems = [];
            historyState.page = 1;
            renderCompactHistory();
            renderHistory();
            showToast('Failed to load login history.', 'fa-triangle-exclamation');
        });
    }

    function loadProfile() {
        if (!window.API) { return; }
        window.API.get('/registrar/profile').then(function (res) {
            var p = res && res.data && typeof res.data === 'object' ? res.data : res;
            if (!p || typeof p !== 'object') { return; }
            var fullName = $('#full-name');
            var emailEl = $('#email-address');
            var userEl = $('#username');
            var addrEl = $('#address');
            if (fullName && p.name) { fullName.value = p.name; }
            if (emailEl && p.email) { emailEl.value = p.email; }
            if (userEl && (p.username || p.userName)) { userEl.value = p.username || p.userName; }
            if (addrEl && p.address) { addrEl.value = p.address; }
        }).catch(function () {});
    }

    /* --------------------------------------------------------------
       Init
       -------------------------------------------------------------- */
    function init() {
        var savedFont = '16';
        var savedTheme = 'light';
        try {
            savedFont = localStorage.getItem('settings.font') || '16';
            savedTheme = localStorage.getItem('settings.theme') || 'light';
        } catch (e) { /* storage unavailable */ }

        document.documentElement.style.setProperty('--font', FONT_SIZES[savedFont] ? savedFont + 'px' : '16px');
        document.body.classList.toggle('theme-dark', savedTheme === 'dark');

        var activeFont = $('#font-size-group button[data-font="' + savedFont + '"]');
        if (activeFont) {
            $$('#font-size-group button').forEach(function (b) { b.classList.remove('active'); });
            activeFont.classList.add('active');
        }
        var activeTheme = $('.theme-card[data-theme="' + savedTheme + '"]');
        if (activeTheme) {
            themeCards.forEach(function (c) { c.classList.remove('active'); });
            activeTheme.classList.add('active');
        }

        loadHistory();
        loadProfile();
    }

    init();
})();