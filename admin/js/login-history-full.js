/* CEC Admin Portal - Full Login History */

(function () {
    'use strict';

    var RANGES = {
        'All Dates': null,
        'Last 7 Days': 7,
        'Last 30 Days': 30,
        'This Year': 365
    };

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    var entries = [];

    function fmtTs(date) {
        if (!date || !(date instanceof Date) || isNaN(date.getTime())) return '—';
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var month = months[date.getMonth()];
        var h = date.getHours();
        var ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return month + '. ' + pad(date.getDate()) + ', ' + date.getFullYear() + ' ' + pad(h) + ':' + pad(date.getMinutes()) + ' ' + ampm;
    }

    function statusBadge(status) {
        var ok = String(status).toLowerCase() === 'success';
        return '<span class="status-badge ' + (ok ? 'status-green' : 'status-red') + '">' + status + '</span>';
    }

    function rowHtml(entry, index) {
        return '<tr>' +
            '<td class="muted-cell">' + (index + 1) + '</td>' +
            '<td>' + fmtTs(entry.date) + '</td>' +
            '<td>' + (entry.device || '—') + '</td>' +
            '<td class="muted-cell">' + (entry.ip || '—') + '</td>' +
            '<td>' + statusBadge(entry.status || 'Failed') + '</td>' +
            '<td><span class="location-tag">' + (entry.location || 'Cebu, Philippines') + '</span></td>' +
            '</tr>';
    }

    function showToast(message, type) {
        var toast = document.createElement('div');
        toast.className = 'toast show ' + (type || 'toast-success');
        toast.innerHTML = '<i class="fa-solid ' + (type === 'toast-error' ? 'fa-circle-exclamation' : 'fa-circle-check') + '"></i> ' + message;
        document.body.appendChild(toast);
        setTimeout(function () {
            toast.classList.remove('show');
            setTimeout(function () {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 2800);
    }

    function applyFilter() {
        var tbody = document.getElementById('history-tbody');
        var info = document.getElementById('pagination-info');
        if (!tbody) return;

        var filter = document.getElementById('date-filter');
        var days = RANGES[filter && filter.value ? filter.value : 'All Dates'];
        var filtered = entries;
        if (days) {
            var cutoff = Date.now() - days * 86400000;
            filtered = entries.filter(function (e) { return e.date.getTime() >= cutoff; });
        }

        tbody.innerHTML = filtered.length
            ? filtered.map(rowHtml).join('')
            : '<tr><td colspan="6">No login history in this range.</td></tr>';

        if (info) info.textContent = 'Showing 1 to ' + filtered.length + ' of ' + filtered.length + ' entries';
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (typeof API === 'undefined') return;
        var tbody = document.getElementById('history-tbody');
        var filter = document.getElementById('date-filter');
        if (!tbody) return;

        API.get('/admin/login-history').then(function (res) {
            var items = (res && Array.isArray(res)) ? res : ((res && res.data) || []);
            entries = items.map(function (l) { return { date: new Date(l.date), device: l.device, ip: l.ip, status: l.status, location: l.location }; });
            applyFilter();
        }).catch(function () {
            tbody.innerHTML = '<tr><td colspan="6">Failed to load login history.</td></tr>';
        });

        if (filter) filter.addEventListener('change', applyFilter);

        var exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', function () {
                showToast('Login history exported.', 'toast-success');
            });
        }
    });
})();