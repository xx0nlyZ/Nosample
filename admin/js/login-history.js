/* CEC Admin Portal - Login History Overview */

(function () {
    'use strict';

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    function fmtTs(date) {
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var month = months[date.getMonth()];
        var h = date.getHours();
        var ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return month + '. ' + pad(date.getDate()) + ', ' + date.getFullYear() + ' ' + pad(h) + ':' + pad(date.getMinutes()) + ' ' + ampm;
    }

    function statusBadge(status) {
        var ok = status === 'Success';
        return '<span class="status-badge ' + (ok ? 'status-green' : 'status-red') + '">' + status + '</span>';
    }

    function rowHtml(entry) {
        return '<tr>' +
            '<td>' + fmtTs(new Date(entry.date)) + '</td>' +
            '<td>' + (entry.device || '—') + '</td>' +
            '<td class="muted-cell">' + (entry.ip || '—') + '</td>' +
            '<td>' + statusBadge(entry.status || 'Failed') + '</td>' +
            '</tr>';
    }

    document.addEventListener('DOMContentLoaded', function () {
        if (typeof API === 'undefined') return;
        var tbody = document.getElementById('history-tbody');
        if (!tbody) return;

        API.get('/admin/login-history').then(function (res) {
            var items = (res && Array.isArray(res)) ? res : ((res && res.data) || []);
            tbody.innerHTML = items.length
                ? items.slice(0, 8).map(rowHtml).join('')
                : '<tr><td colspan="4">No login history available.</td></tr>';
        }).catch(function () {
            tbody.innerHTML = '<tr><td colspan="4">Failed to load login history.</td></tr>';
        });
    });
})();