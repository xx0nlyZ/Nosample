(function () {
    'use strict';

    var KPIS = [];
    var CATEGORIES = [];
    var ACTIVITY_TYPES = [];
    var RECENT = [];

    var ROLE_BADGE = {
        Administrator: 'badge-navy',
        Faculty: 'badge-blue',
        Student: 'badge-green',
        Parent: 'badge-amber'
    };

    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    function fmtTs(date) {
        if (!date || !(date instanceof Date) || isNaN(date.getTime())) return { day: '—', time: '—' };
        var day = MONTHS[date.getMonth()] + ' ' + pad(date.getDate()) + ', ' + date.getFullYear();
        var h = date.getHours();
        var ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return { day: day, time: pad(h) + ':' + pad(date.getMinutes()) + ' ' + ampm };
    }

    function initials(name) {
        return String(name || '').split(/\s+/).filter(function (p) { return p; })
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

    function kpiSkeletonHtml() {
        return '<article class="kpi-skeleton">' +
            '<div class="skeleton s-icon"></div>' +
            '<div class="skeleton s-line short"></div>' +
            '<div class="skeleton s-line value"></div>' +
            '<div class="skeleton s-line" style="width:35%"></div>' +
            '</article>';
    }

    function renderKpis() {
        var grid = document.getElementById('kpi-grid');
        if (!grid) return;
        grid.innerHTML = kpiSkeletonHtml() + kpiSkeletonHtml() + kpiSkeletonHtml() + kpiSkeletonHtml();

        setTimeout(function () {
            if (!KPIS.length) {
                grid.innerHTML = '<p class="empty-copy">No overview data available.</p>';
                return;
            }
            grid.innerHTML = KPIS.map(function (k) {
                var icon = k.trend === 'up' ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
                return '<article class="stat-card">' +
                    '<span class="stat-icon"><i class="' + k.icon + '" aria-hidden="true"></i></span>' +
                    '<div class="stat-info">' +
                    '<p>' + k.label + '</p>' +
                    '<strong>' + k.value + '</strong>' +
                    '<small>' + k.sub + '</small>' +
                    '</div>' +
                    '<span class="trend-badge ' + k.trend + '"><i class="fa-solid ' + icon + '" aria-hidden="true"></i> ' + k.trendText + '</span>' +
                    '</article>';
            }).join('');
        }, 500);
    }

    function renderDonut() {
        var wrap = document.getElementById('donut-wrap');
        if (!wrap) return;
        if (!CATEGORIES.length) {
            wrap.innerHTML = '<p class="empty-copy">No category data available.</p>';
            return;
        }

        var conic = CATEGORIES.map(function (c, i) {
            var start = CATEGORIES.slice(0, i).reduce(function (s, x) { return s + x.pct; }, 0);
            return c.color + ' ' + start + '% ' + (start + c.pct) + '%';
        }).join(', ');

        var legend = '<ul class="donut-legend">' + CATEGORIES.map(function (c) {
            return '<li>' +
                '<span class="legend-swatch" style="background:' + c.color + '"></span>' +
                '<span class="legend-name">' + c.name + '</span>' +
                '<span class="legend-pct">' + c.pct + '%</span>' +
                '</li>';
        }).join('') + '</ul>';

        var totalLabel = KPIS.length && KPIS[0].value != null ? KPIS[0].value : '—';

        wrap.innerHTML =
            '<div class="donut-chart" style="background: conic-gradient(' + conic + ');">' +
            '<div class="donut-hole"><strong>' + totalLabel + '</strong><span>Total Logs</span></div>' +
            '</div>' +
            legend;
    }

    function renderActivityChart() {
        var el = document.getElementById('activity-chart');
        if (!el) return;
        el.innerHTML = '<div class="chart-skeleton" aria-hidden="true">' +
            '<span class="skeleton s-col"></span><span class="skeleton s-col" style="flex:0.7"></span>' +
            '<span class="skeleton s-col" style="flex:0.5"></span><span class="skeleton s-col" style="flex:0.4"></span>' +
            '<span class="skeleton s-col" style="flex:0.2"></span>' +
            '</div>';

        setTimeout(function () {
            if (!ACTIVITY_TYPES.length) {
                el.innerHTML = '<p class="empty-copy">No activity data available.</p>';
                return;
            }
            var max = Math.max.apply(null, ACTIVITY_TYPES.map(function (t) { return t.count; }));
            var HEIGHT = 168;
            var html = '<div class="bar-chart activity-chart">';
            ACTIVITY_TYPES.forEach(function (t) {
                var px = Math.round(t.count / max * HEIGHT);
                html += '<div class="bar-group">' +
                    '<div class="bar-set"><div class="bar" style="height:' + px + 'px;background:' + t.color + '"></div></div>' +
                    '<span class="bar-label">' + t.name + ' <strong>' + t.count + '</strong></span>' +
                    '</div>';
            });
            html += '</div>';
            html += '<div class="legend">' + ACTIVITY_TYPES.map(function (t) {
                return '<span class="legend-item"><span class="legend-dot" style="background:' + t.color + '"></span>' + t.name + '</span>';
            }).join('') + '</div>';
            el.innerHTML = html;
        }, 550);
    }

    function rowHtml(entry) {
        var t = fmtTs(entry.date);
        var badge = ROLE_BADGE[entry.role] || 'badge-blue';
        var pill = entry.status === 'Success' ? 'status-green' : 'status-red';
        var icon = entry.status === 'Success' ? 'fa-circle-check' : 'fa-circle-xmark';
        return '<tr>' +
            '<td class="cell-ts"><strong>' + t.day + '</strong><span>' + t.time + '</span></td>' +
            '<td><div class="user-cell">' +
            '<span class="mini-avatar">' + initials(entry.user) + '</span>' +
            '<span class="user-meta"><strong>' + entry.user + '</strong></span>' +
            '</div></td>' +
            '<td><span class="role-badge ' + badge + '">' + entry.role + '</span></td>' +
            '<td>' + entry.action + '</td>' +
            '<td class="username-cell">' + entry.resource + '</td>' +
            '<td class="username-cell">' + entry.ip + '</td>' +
            '<td><span class="status-badge ' + pill + '"><i class="fa-solid ' + icon + '" aria-hidden="true"></i> ' + entry.status + '</span></td>' +
            '</tr>';
    }

    function renderRecent() {
        var tbody = document.getElementById('recent-tbody');
        if (!tbody) return;
        var skeleton = '';
        for (var i = 0; i < 6; i++) {
            skeleton += '<tr><td colspan="7"><div class="skeleton row-skel"></div></td></tr>';
        }
        tbody.innerHTML = skeleton;

        setTimeout(function () {
            tbody.innerHTML = RECENT.length ? RECENT.map(rowHtml).join('') : '<tr class="empty-row"><td colspan="7">No recent activity.</td></tr>';
        }, 550);
    }

    function normalizeRecent(items) {
        return items.map(function (l) {
            return {
                date: new Date(l.date),
                user: l.user,
                role: l.role,
                action: l.action,
                resource: l.resource,
                ip: l.ip,
                status: l.status
            };
        });
    }

    function loadOverview() {
        API.get('/admin/audit/overview').then(function (res) {
            var d = (res && typeof res === 'object') ? res : {};
            KPIS = d.kpis || [];
            CATEGORIES = d.categories || [];
            ACTIVITY_TYPES = d.activityTypes || d.activity_types || [];
            RECENT = normalizeRecent(d.recent || []);
            populateUserFilter();
            renderKpis();
            renderDonut();
            renderActivityChart();
            renderRecent();
        }).catch(function () {
            renderKpis();
            renderDonut();
            renderActivityChart();
            renderRecent();
            showToast('Failed to load audit overview.', 'error');
        });
    }

    function populateUserFilter() {
        var el = document.getElementById('user-filter');
        if (!el) return;
        var seen = {};
        el.innerHTML = '<option value="">All Users</option>';
        RECENT.forEach(function (e) {
            if (e.user && !seen[e.user]) {
                seen[e.user] = true;
                var opt = document.createElement('option');
                opt.value = e.user;
                opt.textContent = e.user;
                el.appendChild(opt);
            }
        });
    }

    function bindSearch() {
        var btn = document.getElementById('search-btn');
        if (!btn) return;
        btn.addEventListener('click', function () {
            var date = document.getElementById('date-filter');
            var user = document.getElementById('user-filter');
            var role = document.getElementById('role-filter');
            var action = document.getElementById('action-filter');
            var params = new URLSearchParams();
            if (date && date.value) params.set('date', date.value);
            if (user && user.value) params.set('user', user.value);
            if (role && role.value) params.set('role', role.value);
            if (action && action.value) params.set('action', action.value);
            showToast('Opening audit log table with your filters...', '');
            setTimeout(function () {
                window.location.href = 'activity-logs.html?' + params.toString();
            }, 350);
        });
    }

    document.addEventListener('DOMContentLoaded', function () {
        bindSearch();
        loadOverview();
    });
})();