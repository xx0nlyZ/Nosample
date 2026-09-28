(function () {
    'use strict';

    var ROLE_BADGE = {
        Admin: 'badge-navy',
        Faculty: 'badge-blue',
        Student: 'badge-green',
        Staff: 'badge-amber'
    };

    var STATUS_PILL = {
        Active: 'status-green',
        Inactive: 'status-red',
        Suspended: 'status-amber'
    };

    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    var USERS = [];

    var state = {
        page: 1,
        size: 35,
        query: '',
        role: '',
        status: ''
    };

    var selected = {};
    var lastTotal = 1;
    var searchTimer = null;
    var datasetLoaded = false;

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    function fmtTs(date) {
        if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '—';
        var day = MONTHS[date.getMonth()] + ' ' + pad(date.getDate()) + ', ' + date.getFullYear();
        var h = date.getHours();
        var ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return day + '  ' + pad(h) + ':' + pad(date.getMinutes()) + ' ' + ampm;
    }

    function initials(name) {
        return name.split(/\s+/).filter(function (p) { return p; })
            .slice(0, 2).map(function (p) { return p[0].toUpperCase(); })
            .join('');
    }

    function showToast(message, type) {
        var toast = document.querySelector('#cec-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'cec-toast';
            toast.className = 'toast';
            toast.setAttribute('role', 'status');
            document.body.appendChild(toast);
        }
        toast.className = 'toast show ' + (type ? 'toast-' + type : '');
        toast.innerHTML = '<i class="fa-solid ' + (type === 'error' ? 'fa-circle-exclamation' : type === 'success' ? 'fa-circle-check' : 'fa-circle-info') + '" aria-hidden="true"></i>' + message;
        clearTimeout(toast._timer);
        toast._timer = setTimeout(function () {
            toast.className = 'toast';
        }, 2600);
    }

    function matches(user) {
        var q = state.query.toLowerCase().trim();
        if (q) {
            var haystack = [
                user.id, user.fullName, user.username,
                user.role, user.status
            ].join(' ').toLowerCase();
            if (haystack.indexOf(q) === -1) return false;
        }
        if (state.role && user.role !== state.role) return false;
        if (state.status && user.status !== state.status) return false;
        return true;
    }

    function filteredUsers() {
        return USERS.filter(matches);
    }

    function countPillsHtml() {
        var total = USERS.length;
        var active = 0, inactive = 0, suspended = 0;
        USERS.forEach(function (u) {
            if (u.status === 'Active') active++;
            else if (u.status === 'Inactive') inactive++;
            else suspended++;
        });
        return '<span class="count-pill pill-blue"><strong>' + total + '</strong> Status</span>' +
            '<span class="count-pill pill-green"><strong>' + active + '</strong> Active</span>' +
            '<span class="count-pill pill-red"><strong>' + inactive + '</strong> Inactive</span>' +
            '<span class="count-pill pill-yellow"><strong>' + suspended + '</strong> Suspended</span>';
    }

    function rowHtml(user) {
        var pill = STATUS_PILL[user.status];
        var badge = ROLE_BADGE[user.role];
        var checked = selected[user.id] ? ' checked' : '';
        return '<tr>' +
            '<td><input type="checkbox" class="row-check" data-id="' + user.id + '"' + checked + ' aria-label="Select ' + user.fullName + '"></td>' +
            '<td class="cell-id">' + user.id + '</td>' +
            '<td><div class="user-cell">' +
            '<span class="mini-avatar">' + initials(user.fullName) + '</span>' +
            '<span class="user-meta"><strong>' + user.fullName + '</strong></span>' +
            '</div></td>' +
            '<td class="username-cell">' + user.username + '</td>' +
            '<td><span class="role-badge ' + badge + '">' + user.role + '</span></td>' +
            '<td><span class="status-badge ' + pill + '"><i class="fa-solid fa-circle" aria-hidden="true"></i> ' + user.status + '</span></td>' +
            '<td class="username-cell">' + fmtTs(user.lastActive) + '</td>' +
            '<td><button type="button" class="btn btn-outline btn-sm" data-edit="' + user.id + '"><i class="fa-solid fa-pen" aria-hidden="true"></i> Edit</button></td>' +
            '</tr>';
    }

    function skeletonRowsHtml() {
        var html = '';
        for (var i = 0; i < 5; i++) {
            html += '<tr><td colspan="8"><div class="skeleton row-skel"></div></td></tr>';
        }
        return html;
    }

    function emptyRowHtml() {
        return '<tr class="empty-row"><td colspan="8">No users match your filters.</td></tr>';
    }

    function errorRowHtml(message) {
        return '<tr class="empty-row"><td colspan="8">Failed to load users. ' + message + '</td></tr>';
    }

    function renderRows() {
        var tbody = document.getElementById('user-tbody');
        var totalCountEl = document.getElementById('user-count');
        if (!tbody) return;

        var list = filteredUsers();
        lastTotal = Math.max(1, Math.ceil(list.length / state.size));
        if (state.page > lastTotal) state.page = lastTotal;
        if (state.page < 1) state.page = 1;

        var start = (state.page - 1) * state.size;
        var pageItems = list.slice(start, start + state.size);

        tbody.innerHTML = pageItems.length
            ? pageItems.map(rowHtml).join('')
            : emptyRowHtml();

        if (totalCountEl) {
            totalCountEl.textContent = list.length + ' ' + (list.length === 1 ? 'user' : 'users');
        }

        renderPagination();
        syncSelectAll();
    }

    function renderPagination() {
        var container = document.getElementById('page-numbers');
        if (!container) return;

        var html = '';
        for (var i = 1; i <= lastTotal; i++) {
            html += '<button type="button" class="page-num' + (i === state.page ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>';
        }
        container.innerHTML = html;

        var prev = document.getElementById('prev-page');
        var next = document.getElementById('next-page');
        if (prev) prev.disabled = state.page <= 1;
        if (next) next.disabled = state.page >= lastTotal;
    }

    function visibleBoxes(tbody) {
        return Array.prototype.slice.call(tbody ? tbody.querySelectorAll('.row-check') : []);
    }

    function syncSelectAll() {
        var tbody = document.getElementById('user-tbody');
        var master = document.getElementById('select-all');
        if (!tbody || !master) return;
        var boxes = visibleBoxes(tbody);
        if (!boxes.length) {
            master.checked = false;
            master.indeterminate = false;
            return;
        }
        var checkedCount = boxes.filter(function (b) { return b.checked; }).length;
        master.checked = checkedCount === boxes.length;
        master.indeterminate = checkedCount > 0 && checkedCount < boxes.length;
    }

    function loadUsers() {
        var tbody = document.getElementById('user-tbody');
        if (!tbody) return;

        if (datasetLoaded) {
            renderRows();
            return;
        }

        tbody.innerHTML = skeletonRowsHtml();
        API.get('/admin/users').then(function (res) {
            datasetLoaded = true;
            var items = (res && Array.isArray(res)) ? res : ((res && res.data) || []);
            USERS = items.map(function (u) {
                if (u.lastActive) u.lastActive = new Date(u.lastActive);
                return u;
            });
            var pills = document.getElementById('count-pills');
            if (pills) pills.innerHTML = countPillsHtml();
            renderRows();
        }).catch(function (err) {
            datasetLoaded = true;
            tbody.innerHTML = errorRowHtml((err && err.message) ? err.message : 'Server unreachable.');
            showToast('Failed to load users.', 'error');
        });
    }

    function bindSearch() {
        var el = document.getElementById('user-search');
        if (!el) return;
        el.addEventListener('input', function () {
            state.query = el.value;
            state.page = 1;
            clearTimeout(searchTimer);
            searchTimer = setTimeout(loadUsers, 300);
        });
    }

    function bindFilters() {
        var roleEl = document.getElementById('role-filter');
        var statusEl = document.getElementById('status-filter');
        if (roleEl) {
            roleEl.addEventListener('change', function () {
                state.role = roleEl.value;
                state.page = 1;
                loadUsers();
            });
        }
        if (statusEl) {
            statusEl.addEventListener('change', function () {
                state.status = statusEl.value;
                state.page = 1;
                loadUsers();
            });
        }
    }

    function bindPagination() {
        var numbers = document.getElementById('page-numbers');
        if (numbers) {
            numbers.addEventListener('click', function (e) {
                var btn = e.target.closest('.page-num');
                if (btn && !btn.classList.contains('active')) {
                    state.page = parseInt(btn.getAttribute('data-page'), 10);
                    loadUsers();
                }
            });
        }

        var prev = document.getElementById('prev-page');
        var next = document.getElementById('next-page');
        if (prev) prev.addEventListener('click', function () { if (state.page > 1) { state.page--; loadUsers(); } });
        if (next) next.addEventListener('click', function () { if (state.page < lastTotal) { state.page++; loadUsers(); } });

        var jump = document.getElementById('jump-input');
        if (jump) {
            jump.addEventListener('change', function () {
                var value = parseInt(jump.value, 10);
                if (!value || value < 1) { jump.value = state.page; return; }
                state.page = Math.min(value, lastTotal);
                jump.value = state.page;
                loadUsers();
            });
        }

        var sizeSelect = document.getElementById('page-size');
        if (sizeSelect) {
            sizeSelect.addEventListener('change', function () {
                state.size = parseInt(sizeSelect.value, 10);
                state.page = 1;
                loadUsers();
            });
        }
    }

    function bindSelection() {
        var tbody = document.getElementById('user-tbody');
        var master = document.getElementById('select-all');
        if (!tbody || !master) return;

        master.addEventListener('change', function () {
            visibleBoxes(tbody).forEach(function (box) {
                box.checked = master.checked;
                if (master.checked) selected[box.getAttribute('data-id')] = true;
                else delete selected[box.getAttribute('data-id')];
            });
        });

        tbody.addEventListener('change', function (e) {
            var box = e.target.closest('.row-check');
            if (!box) return;
            var id = box.getAttribute('data-id');
            if (box.checked) selected[id] = true;
            else delete selected[id];
            syncSelectAll();
        });

        tbody.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-edit]');
            if (!btn) return;
            window.location.href = 'edit-user-profile.html?userId=' + btn.getAttribute('data-edit');
        });
    }

    function closeExportMenu() {
        var menu = document.getElementById('export-menu');
        var btn = document.getElementById('export-btn');
        if (menu) menu.hidden = true;
        if (btn) btn.setAttribute('aria-expanded', 'false');
    }

    function bindExport() {
        var btn = document.getElementById('export-btn');
        var menu = document.getElementById('export-menu');
        if (!btn || !menu) return;

        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var open = menu.hidden;
            menu.hidden = !open;
            btn.setAttribute('aria-expanded', String(open));
        });

        menu.addEventListener('click', function (e) {
            var item = e.target.closest('[data-format]');
            if (!item) return;
            var format = item.getAttribute('data-format').toUpperCase();
            closeExportMenu();
            var count = filteredUsers().length;
            showToast('Preparing ' + format + ' export for ' + count + ' users...', '');
            setTimeout(function () {
                showToast(format + ' export is ready to download.', 'success');
            }, 900);
        });

        document.addEventListener('click', function () { closeExportMenu(); });
    }

    document.addEventListener('DOMContentLoaded', function () {
        bindSearch();
        bindFilters();
        bindPagination();
        bindSelection();
        bindExport();
        loadUsers();
    });
})();