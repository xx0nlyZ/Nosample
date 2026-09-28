(function () {
    'use strict';

    var KPIS = [];
    var users7 = { labels: [], students: [], teachers: [], parents: [], admins: [] };
    var users30 = { labels: [], students: [], teachers: [], parents: [], admins: [] };
    var activity7 = { labels: [], logins: [], actions: [] };
    var activity30 = { labels: [], logins: [], actions: [] };

    var BAR_COLORS = { students: '#1D4E9B', teachers: '#2E9E63', parents: '#E8A33D', admins: '#7B61C4' };

    function fmt(count) {
        if (typeof count === 'number') return count.toLocaleString();
        return count || 0;
    }

    function statCardHtml(k) {
        var icon = k.trend === 'up' ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
        return '<article class="stat-card">' +
            '<span class="stat-icon"><i class="' + (k.icon || 'fa-chart-column') + '" aria-hidden="true"></i></span>' +
            '<div class="stat-info">' +
            '<p>' + (k.title || k.label || '') + '</p>' +
            '<strong>' + fmt(k.value) + '</strong>' +
            '<small>' + (k.period || k.sub || '') + '</small>' +
            '</div>' +
            '<span class="trend-badge ' + (k.trend === 'down' ? 'down' : 'up') + '"><i class="fa-solid ' + icon + '" aria-hidden="true"></i> ' + (k.delta || k.trendText || '') + '</span>' +
            '</article>';
    }

    function renderKpis() {
        var grid = document.getElementById('kpi-grid');
        if (!grid) return;

        var skeleton = '';
        for (var i = 0; i < 4; i++) {
            skeleton += '<article class="kpi-skeleton">' +
                '<div class="skeleton s-icon"></div>' +
                '<div class="skeleton s-line short"></div>' +
                '<div class="skeleton s-line value"></div>' +
                '<div class="skeleton s-line" style="width:35%"></div>' +
                '</article>';
        }
        grid.innerHTML = skeleton;

        setTimeout(function () {
            if (!KPIS.length) {
                grid.innerHTML = '<p class="empty-copy">No dashboard metrics available.</p>';
                return;
            }
            grid.innerHTML = KPIS.map(statCardHtml).join('');
        }, 350);
    }

    function renderUserChart(data) {
        var container = document.getElementById('user-chart');
        var skeleton = document.getElementById('user-chart-skeleton');
        if (!container) return;

        if (skeleton) skeleton.hidden = true;

        if (!data || !data.labels || !data.labels.length) {
            container.innerHTML = '<p class="empty-copy">No data available.</p>';
            return;
        }

        var max = 0;
        data.labels.forEach(function (_, i) {
            ['students', 'teachers', 'parents', 'admins'].forEach(function (key) {
                var v = data[key][i] || 0;
                if (v > max) max = v;
            });
        });
        max = Math.max(max, 1);

        var HEIGHT = 168;
        var html = '<div class="bar-chart">';
        data.labels.forEach(function (label, i) {
            html += '<div class="bar-group">' +
                '<div class="bar-set">' +
                '<div class="bar students" style="height:' + Math.round((data.students[i] || 0) / max * HEIGHT) + 'px"></div>' +
                '<div class="bar teachers" style="height:' + Math.round((data.teachers[i] || 0) / max * HEIGHT) + 'px"></div>' +
                '<div class="bar parents" style="height:' + Math.round((data.parents[i] || 0) / max * HEIGHT) + 'px"></div>' +
                '<div class="bar admins" style="height:' + Math.round((data.admins[i] || 0) / max * HEIGHT) + 'px"></div>' +
                '</div>' +
                '<span class="bar-label">' + label + '</span>' +
                '</div>';
        });
        html += '</div>';
        html += '<div class="legend">' + [
            { name: 'Students', color: BAR_COLORS.students },
            { name: 'Teachers', color: BAR_COLORS.teachers },
            { name: 'Parents', color: BAR_COLORS.parents },
            { name: 'Admins', color: BAR_COLORS.admins }
        ].map(function (l) {
            return '<span class="legend-item"><span class="legend-dot" style="background:' + l.color + '"></span>' + l.name + '</span>';
        }).join('') + '</div>';

        container.innerHTML = html;
    }

    function renderActivityChart(data) {
        var container = document.getElementById('activity-chart');
        var skeleton = document.getElementById('activity-chart-skeleton');
        if (!container) return;

        if (skeleton) skeleton.hidden = true;

        if (!data || !data.labels || !data.labels.length) {
            container.innerHTML = '<p class="empty-copy">No data available.</p>';
            return;
        }

        var W = 560;
        var H = 200;
        var padL = 34;
        var padR = 12;
        var padT = 16;
        var padB = 26;
        var innerW = W - padL - padR;
        var innerH = H - padT - padB;

        var max = 0;
        data.labels.forEach(function (_, i) {
            if ((data.logins[i] || 0) > max) max = data.logins[i];
            if ((data.actions[i] || 0) > max) max = data.actions[i];
        });
        max = Math.max(max, 1);

        function toX(i) {
            return data.labels.length <= 1 ? padL + innerW / 2 : padL + (innerW * i) / (data.labels.length - 1);
        }
        function toY(v) {
            return padT + innerH - (v / max) * innerH;
        }

        var grid = '';
        for (var g = 0; g <= 4; g++) {
            var gy = padT + (innerH * g) / 4;
            grid += '<line class="grid-line" x1="' + padL + '" y1="' + gy + '" x2="' + (padL + innerW) + '" y2="' + gy + '"/>';
        }

        var areaPoints = '';
        var loginPoints = '';
        var actionPoints = '';
        var dots = '';
        data.labels.forEach(function (_, i) {
            var x = toX(i);
            var lx = toX(i);
            var ly = toY(data.logins[i] || 0);
            var ax = toX(i);
            var ay = toY(data.actions[i] || 0);
            areaPoints += (i ? ' ' : '') + x.toFixed(1) + ',' + ly.toFixed(1);
            loginPoints += (i ? ' ' : '') + x.toFixed(1) + ',' + ly.toFixed(1);
            actionPoints += (i ? ' ' : '') + x.toFixed(1) + ',' + ay.toFixed(1);
            dots += '<circle class="dot" cx="' + x.toFixed(1) + '" cy="' + ly.toFixed(1) + '" r="3.5" fill="#1D4E9B"/>';
            dots += '<circle class="dot" cx="' + x.toFixed(1) + '" cy="' + ay.toFixed(1) + '" r="3.5" fill="#2E9E63"/>';
        });

        var baseY = padT + innerH;
        var areaD = 'M' + areaPoints.split(' ').join(' L') + ' L' + toX(data.labels.length - 1).toFixed(1) + ',' + baseY + ' L' + toX(0).toFixed(1) + ',' + baseY + ' Z';

        var labels = '';
        data.labels.forEach(function (label, i) {
            labels += '<text class="axis-label" text-anchor="middle" x="' + toX(i).toFixed(1) + '" y="' + (H - 8) + '">' + label + '</text>';
        });

        container.innerHTML =
            '<svg class="line-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="System activity chart">' +
            grid +
            '<path class="area" d="' + areaD + '"/>' +
            '<polyline class="line-logins" points="' + loginPoints + '"/>' +
            '<polyline class="line-actions" points="' + actionPoints + '"/>' +
            dots +
            labels +
            '</svg>' +
            '<div class="legend">' +
            '<span class="legend-item"><span class="legend-dot" style="background:#1D4E9B"></span>Logins</span>' +
            '<span class="legend-item"><span class="legend-dot" style="background:#2E9E63"></span>Actions</span>' +
            '</div>';
    }

    function renderCharts(timeframe) {
        renderUserChart(timeframe === '30' ? users30 : users7);
        renderActivityChart(timeframe === '30' ? activity30 : activity7);
    }

    var ACTIVITY_ICONS = {
        'user-added': { cls: 'user', icon: 'fa-user-plus' },
        'user-updated': { cls: 'user', icon: 'fa-user-pen' },
        'report': { cls: 'report', icon: 'fa-file-lines' },
        'backup': { cls: 'system', icon: 'fa-server' },
        'message': { cls: 'message', icon: 'fa-envelope' },
        'announcement': { cls: 'announcement', icon: 'fa-bullhorn' },
        'grade': { cls: 'report', icon: 'fa-file-lines' },
        'settings': { cls: 'system', icon: 'fa-gear' }
    };

    function activityItemHtml(item) {
        var type = ACTIVITY_ICONS[item.type] || { cls: 'system', icon: 'fa-circle-info' };
        return '<li class="activity-item">' +
            '<span class="act-icon ' + type.cls + '" aria-hidden="true"><i class="fa-solid ' + type.icon + '"></i></span>' +
            '<div class="act-body"><strong>' + item.title + '</strong><p>' + item.description + '</p></div>' +
            '<span class="act-time">' + item.time + '</span>' +
            '</li>';
    }

    function renderRecentActivity(items) {
        var list = document.getElementById('activity-list');
        if (!list) return;
        if (!items.length) {
            list.innerHTML = '<li class="activity-item"><div class="act-body"><p>No recent activity.</p></div></li>';
            return;
        }
        list.innerHTML = items.map(activityItemHtml).join('');
    }

    function updateSyncedTime() {
        var el = document.getElementById('last-updated');
        if (!el) return;
        el.textContent = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }

    function loadRecentActivity() {
        var list = document.getElementById('activity-list');
        if (!list) return;
        API.get('/admin/dashboard/recent-activity').then(function (res) {
            var items = (res && Array.isArray(res)) ? res : ((res && res.data) || []);
            renderRecentActivity(items);
        }).catch(function () {
            renderRecentActivity([]);
        });
    }

    function loadDashboard() {
        API.get('/admin/dashboard/metrics').then(function (res) {
            var d = (res && typeof res === 'object') ? res : {};
            KPIS = d.kpis || [];
            users7 = d.users7 || users7;
            users30 = d.users30 || users30;
            activity7 = d.activity7 || activity7;
            activity30 = d.activity30 || activity30;

            renderKpis();
            renderCharts(document.getElementById('timeframe-select') ? document.getElementById('timeframe-select').value : '7');
            updateSyncedTime();
        }).catch(function () {
            renderKpis();
            renderCharts('7');
            showToast('Failed to load dashboard metrics.', 'error');
        });

        loadRecentActivity();
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

    document.addEventListener('DOMContentLoaded', function () {
        var timeframeSelect = document.getElementById('timeframe-select');
        if (timeframeSelect) {
            timeframeSelect.addEventListener('change', function () {
                renderCharts(timeframeSelect.value);
            });
        }

        var refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function () {
                refreshBtn.classList.add('btn-spin');
                setTimeout(function () {
                    loadDashboard();
                    updateSyncedTime();
                    refreshBtn.classList.remove('btn-spin');
                }, 400);
            });
        }

        loadDashboard();
    });
})();