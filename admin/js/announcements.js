(function () {
    'use strict';

    var STATUS_PILL = {
        Live: 'status-green',
        Scheduled: 'status-blue',
        Expired: 'status-gray'
    };

    var state = {
        tab: 'all',
        search: ''
    };

    var announcements = [];

    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    function fmtTs(date) {
        if (!date) return 'Today';
        var day = MONTHS[date.getMonth()] + ' ' + date.getDate();
        var h = date.getHours();
        var ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return day + ' · ' + h + ':' + pad(date.getMinutes()) + ' ' + ampm;
    }

    function initials(text) {
        return String(text || 'A').split(/\s+/).filter(function (p) { return p; })
            .slice(0, 2).map(function (p) { return p[0].toUpperCase(); })
            .join('');
    }

    function matches(ann) {
        if (state.tab !== 'all' && ann.status !== state.tab) return false;
        var q = state.search.trim().toLowerCase();
        if (q) {
            var hay = String(ann.subject + ' ' + ann.author + ' ' + ann.content).toLowerCase();
            if (hay.indexOf(q) === -1) return false;
        }
        return true;
    }

    function itemHtml(ann) {
        var pill = STATUS_PILL[ann.status] || 'status-gray';
        var avatar = ann.authorAvatar || ann.author || 'A';
        var isExpiring = ann.status === 'Live' && ann.expiresSoon === true;
        var expiresBadge = isExpiring
            ? '<span class="count-pill pill-yellow"><i class="fa-solid fa-clock" aria-hidden="true"></i> Expires soon</span>'
            : '';
        return '<div class="ann-item" data-id="' + ann.id + '">' +
            '<div class="ann-item-left">' +
            '<div class="ann-avatar"><span class="avatar-text">' + initials(avatar) + '</span></div>' +
            '<div class="ann-content">' +
            '<div class="ann-meta-row">' +
            '<span class="ann-status ' + pill + '"><i class="fa-solid fa-circle" aria-hidden="true"></i> ' + ann.status + '</span>' +
            expiresBadge +
            '<span class="ann-audience">' + (ann.audience && ann.audience.length ? ann.audience.join(', ') : 'All') + '</span>' +
            '</div>' +
            '<h3 class="ann-title">' + ann.subject + '</h3>' +
            '<p class="ann-excerpt">' + (ann.content || '').replace(/<[^>]*>/g, ' ').slice(0, 140) + '</p>' +
            '</div>' +
            '</div>' +
            '<div class="ann-item-right">' +
            '<div class="ann-author-row">' +
            '<span class="mini-avatar">' + initials(ann.author || 'Admin') + '</span>' +
            '<span class="ann-author"><strong>' + (ann.author || 'Admin') + '</strong></span>' +
            '<span class="ann-time">' + fmtTs(new Date(ann.createdAt)) + '</span>' +
            '</div>' +
            '<div class="ann-actions">' +
            '<button type="button" class="btn btn-outline btn-sm" data-view="' + ann.id + '"><i class="fa-solid fa-eye" aria-hidden="true"></i> View</button>' +
            '<button type="button" class="btn btn-outline btn-sm" data-edit="' + ann.id + '"><i class="fa-solid fa-pen" aria-hidden="true"></i> Edit</button>' +
            '<button type="button" class="btn btn-outline-danger btn-sm" data-delete="' + ann.id + '"><i class="fa-solid fa-trash" aria-hidden="true"></i> Delete</button>' +
            '</div>' +
            '</div>' +
            '<button type="button" class="ann-menu-toggle" data-menu="' + ann.id + '" aria-label="More actions"><i class="fa-solid fa-ellipsis" aria-hidden="true"></i></button>' +
            '</div>';
    }

    function skeletonItems() {
        var html = '';
        for (var i = 0; i < 3; i++) {
            html += '<div class="ann-item"><div class="skeleton line-skel" style="width:90%"></div><div class="skeleton line-skel" style="width:65%"></div></div>';
        }
        return html;
    }

    function emptyState() {
        return '<div class="ann-empty">' +
            '<div class="empty-icon"><i class="fa-solid fa-bullhorn" aria-hidden="true"></i></div>' +
            '<h3>No announcements found</h3>' +
            '<p>No announcements match your current filters.</p>' +
            '</div>';
    }

    function errorState() {
        return '<div class="ann-empty">' +
            '<div class="empty-icon"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i></div>' +
            '<h3>Could not load announcements</h3>' +
            '<p>Please try again later.</p>' +
            '</div>';
    }

    function render() {
        var list = document.getElementById('ann-list');
        if (!list) return;

        var visible = announcements.filter(matches);
        var countEl = document.getElementById('ann-count');
        if (countEl) countEl.textContent = visible.length + (visible.length === 1 ? ' announcement' : ' announcements');

        list.innerHTML = announcements.length
            ? (visible.length ? visible.map(itemHtml).join('') : emptyState())
            : errorState();
    }

    function loadAnnouncements() {
        var list = document.getElementById('ann-list');
        if (!list) return;
        list.innerHTML = skeletonItems();

        API.get('/admin/announcements').then(function (res) {
            var items = (res && Array.isArray(res)) ? res : ((res && res.data) || []);
            announcements = items.map(function (a) {
                return {
                    id: a.id,
                    subject: a.subject,
                    content: a.content,
                    audience: a.audience || [],
                    status: a.status,
                    author: a.author,
                    authorAvatar: a.authorAvatar,
                    createdAt: a.createdAt,
                    expiresSoon: !!a.expiresSoon
                };
            });
            render();
        }).catch(function () {
            list.innerHTML = errorState();
            showToast('Failed to load announcements.', 'error');
        });
    }

    function toggleMenus() {
        var open = document.querySelectorAll('.ann-actions.open');
        open.forEach(function (menu) { menu.classList.remove('open'); });
    }

    function openMenu(id) {
        var menu = document.querySelector('[data-menu="' + id + '"]');
        if (!menu) return;
        var actions = menu.previousElementSibling;
        if (actions && actions.classList) {
            toggleMenus();
            actions.classList.add('open');
        }
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

    function handleDelete(id) {
        var del = document.getElementById('btn-delete');
        if (del) del.classList.add('btn-spin');
        API.del('/admin/announcements/' + encodeURIComponent(id)).then(function () {
            announcements = announcements.filter(function (a) { return a.id !== id; });
            var item = document.querySelector('.ann-item[data-id="' + id + '"]');
            if (item) item.remove();
            var countEl = document.getElementById('ann-count');
            var visible = announcements.filter(matches);
            if (countEl) countEl.textContent = visible.length + (visible.length === 1 ? ' announcement' : ' announcements');
            showToast('Announcement deleted.', 'success');
        }).catch(function () {
            showToast('Failed to delete announcement.', 'error');
        }).finally(function () {
            if (del) del.classList.remove('btn-spin');
        });
    }

    function bindListEvents() {
        var list = document.getElementById('ann-list');
        if (!list) return;

        list.addEventListener('click', function (e) {
            var viewBtn = e.target.closest('[data-view]');
            var editBtn = e.target.closest('[data-edit]');
            var deleteBtn = e.target.closest('[data-delete]');
            var menuBtn = e.target.closest('[data-menu]');

            if (viewBtn) {
                var id = viewBtn.getAttribute('data-view');
                window.location.href = 'announcement-view.html?id=' + id;
                return;
            }
            if (editBtn) {
                window.location.href = 'announcement-form.html?id=' + editBtn.getAttribute('data-edit');
                return;
            }
            if (deleteBtn) {
                handleDelete(deleteBtn.getAttribute('data-delete'));
                return;
            }
            if (menuBtn) {
                openMenu(menuBtn.getAttribute('data-menu'));
            }
        });
    }

    function bindUi() {
        var tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                tabs.forEach(function (t) { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');
                state.tab = tab.getAttribute('data-tab') || 'all';
                render();
            });
        });

        var search = document.getElementById('ann-search');
        if (search) {
            search.addEventListener('input', function () {
                state.search = search.value;
                render();
            });
        }

        var fab = document.getElementById('btn-create');
        if (fab) {
            fab.addEventListener('click', function () {
                window.location.href = 'announcement-form.html';
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        bindUi();
        bindListEvents();
        loadAnnouncements();
    });
})();