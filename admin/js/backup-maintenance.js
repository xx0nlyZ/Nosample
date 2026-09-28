(function () {
    'use strict';

    var TYPE_BADGE = {
        'Full': 'badge-type-full',
        'Incremental': 'badge-type-incr',
        'DB Only': 'badge-type-db'
    };
    var STATUS_PILL = {
        'Success': 'status-green',
        'In-Progress': 'status-blue',
        'Failed': 'status-red'
    };
    var STATUS_ICON = {
        'Success': 'fa-circle-check',
        'In-Progress': 'fa-spinner fa-spin',
        'Failed': 'fa-circle-xmark'
    };

    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    var BACKUPS = [];
    var TASKS = [];
    var HEALTH = [];

    var TASK_PILL = {
        'Planned': 'status-blue',
        'In-Progress': 'status-amber',
        'Completed': 'status-green'
    };
    var TASK_ICON = {
        'Planned': 'fa-calendar',
        'In-Progress': 'fa-spinner fa-spin',
        'Completed': 'fa-circle-check'
    };

    var bState = {
        page: 1,
        size: 8,
        query: '',
        type: '',
        status: ''
    };
    var bTotal = 1;

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

    function matches(b) {
        var q = bState.query.toLowerCase().trim();
        if (q) {
            var haystack = [b.id, b.type, b.storage, b.duration, b.status].join(' ').toLowerCase();
            if (haystack.indexOf(q) === -1) return false;
        }
        if (bState.type && b.type !== bState.type) return false;
        if (bState.status && b.status !== bState.status) return false;
        return true;
    }

    function backupRowHtml(b) {
        var t = fmtTs(b.date);
        var pill = STATUS_PILL[b.status] || 'status-blue';
        var icon = STATUS_ICON[b.status] || 'fa-circle-info';
        return '<tr>' +
            '<td class="cell-id">' + b.id + '</td>' +
            '<td class="cell-ts"><strong>' + t.day + '</strong><span>' + t.time + '</span></td>' +
            '<td><span class="' + (TYPE_BADGE[b.type] || 'badge-type-db') + '">' + b.type + '</span></td>' +
            '<td class="username-cell">' + b.storage + '</td>' +
            '<td class="username-cell">' + b.duration + '</td>' +
            '<td><span class="status-badge ' + pill + '"><i class="fa-solid ' + icon + '" aria-hidden="true"></i> ' + b.status + '</span></td>' +
            '<td><button type="button" class="btn btn-outline btn-sm" data-logs="' + b.id + '"><i class="fa-solid fa-file-lines" aria-hidden="true"></i> View Logs</button></td>' +
            '</tr>';
    }

    function skeletonRowsHtml(cols) {
        var html = '';
        for (var i = 0; i < 6; i++) {
            html += '<tr><td colspan="' + cols + '"><div class="skeleton row-skel"></div></td></tr>';
        }
        return html;
    }

    function renderBackups() {
        var tbody = document.getElementById('backup-tbody');
        var info = document.getElementById('backup-info');
        if (!tbody) return;

        var list = BACKUPS.filter(matches);
        bTotal = Math.max(1, Math.ceil(list.length / bState.size));
        if (bState.page > bTotal) bState.page = bTotal;
        if (bState.page < 1) bState.page = 1;

        var start = (bState.page - 1) * bState.size;
        var pageItems = list.slice(start, start + bState.size);

        tbody.innerHTML = pageItems.length
            ? pageItems.map(backupRowHtml).join('')
            : '<tr class="empty-row"><td colspan="7">No backups match your filters.</td></tr>';

        if (info) {
            var from = list.length ? start + 1 : 0;
            info.textContent = 'Showing ' + from + ' - ' + (start + pageItems.length) + ' of ' + list.length + ' backups';
        }

        var pages = document.getElementById('b-pages');
        if (pages) {
            var html = '';
            for (var i = 1; i <= bTotal; i++) {
                html += '<button type="button" class="page-num' + (i === bState.page ? ' active' : '') + '" data-page="' + i + '">' + i + '</button>';
            }
            pages.innerHTML = html;
        }

        var prev = document.getElementById('b-prev');
        var next = document.getElementById('b-next');
        if (prev) prev.disabled = bState.page <= 1;
        if (next) next.disabled = bState.page >= bTotal;
    }

    function taskRowHtml(task) {
        var pill = TASK_PILL[task.status] || 'status-blue';
        var icon = TASK_ICON[task.status] || 'fa-calendar';
        var action = task.status === 'Completed'
            ? '<button type="button" class="btn btn-outline btn-sm" data-task="' + task.name + '"><i class="fa-solid fa-eye" aria-hidden="true"></i> View Logs</button>'
            : '<button type="button" class="btn btn-outline btn-sm" data-task="' + task.name + '"><i class="fa-solid fa-play" aria-hidden="true"></i> Run Now</button>';
        return '<tr>' +
            '<td><strong>' + task.name + '</strong></td>' +
            '<td class="username-cell">' + task.time + '</td>' +
            '<td><span class="status-badge ' + pill + '"><i class="fa-solid ' + icon + '" aria-hidden="true"></i> ' + task.status + '</span></td>' +
            '<td>' + action + '</td>' +
            '</tr>';
    }

    function renderTasks() {
        var tbody = document.getElementById('task-tbody');
        if (!tbody) return;
        tbody.innerHTML = skeletonRowsHtml(4);
        setTimeout(function () {
            tbody.innerHTML = TASKS.length ? TASKS.map(taskRowHtml).join('') : '<tr class="empty-row"><td colspan="4">No maintenance tasks.</td></tr>';
        }, 450);
    }

    function healthRowHtml(metric) {
        var tone = metric.tone || 'normal';
        var meter = metric.meter != null ? metric.meter : 0;
        return '<div class="health-metric">' +
            '<div><span class="hm-label">' + metric.label + '</span><span class="hm-sub">' + metric.sub + '</span></div>' +
            '<div class="health-meter ' + tone + '"><span style="width:' + meter + '%"></span></div>' +
            '<strong class="hm-value">' + metric.value + '</strong>' +
            '</div>';
    }

    function renderHealth() {
        var list = document.getElementById('health-list');
        if (!list) return;
        list.innerHTML = '<div class="health-metric" style="padding:16px 0"><div class="skeleton row-skel" style="margin-right:auto;width:60%"></div><div class="skeleton row-skel" style="width:30%"></div></div>';
        setTimeout(function () {
            list.innerHTML = HEALTH.length ? HEALTH.map(healthRowHtml).join('') : '<p class="empty-copy">No health data available.</p>';
        }, 450);
    }

    function updateSysTime() {
        var el = document.getElementById('sys-time');
        if (!el) return;
        var now = new Date();
        var h = now.getHours();
        var ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        el.textContent = pad(h) + ':' + pad(now.getMinutes()) + ' ' + ampm;
    }

    /* ==========================================================================
       CONSOLE LOG DRAWER
       ========================================================================== */

    var drawerTimer = null;
    var currentBackupId = null;

    function normalizeLogLine(line) {
        var stamp;
        if (line.stamp || line.timestamp) {
            var ts = new Date(line.stamp || line.timestamp);
            if (!isNaN(ts.getTime())) {
                stamp = pad(ts.getHours()) + ':' + pad(ts.getMinutes()) + ':' + pad(ts.getSeconds());
            } else {
                stamp = line.stamp || pad(new Date().getHours()) + ':' + pad(new Date().getMinutes()) + ':' + pad(new Date().getSeconds());
            }
        } else {
            stamp = '--:--:--';
        }
        return { stamp: stamp, type: line.type || 'info', text: line.text || line.message || '' };
    }

    function openDrawer(backupId, taskName) {
        var backdrop = document.getElementById('drawer-backdrop');
        var drawer = document.getElementById('log-drawer');
        var subId = document.getElementById('drawer-backup-id');
        var terminal = document.getElementById('terminal');
        if (!drawer || !terminal) return;

        currentBackupId = backupId || taskName || '';
        if (subId) subId.textContent = currentBackupId;
        terminal.innerHTML = '';
        for (var i = 0; i < 6; i++) {
            terminal.innerHTML += '<div class="skeleton terminal-skel"></div>';
        }

        drawer.hidden = false;
        if (backdrop) backdrop.hidden = false;
        requestAnimationFrame(function () {
            drawer.classList.add('open');
        });

        clearTimeout(drawerTimer);
        var path = taskName
            ? '/admin/backups/tasks/' + encodeURIComponent(taskName) + '/log'
            : '/admin/backups/' + encodeURIComponent(backupId) + '/log';

        API.get(path).then(function (res) {
            var lines = (res && Array.isArray(res)) ? res : ((res && res.data) || []);
            if (!lines.length) {
                lines = [{ type: 'error', text: 'No log output available for ' + (backupId || taskName) + '.' }];
            }
            var normalized = lines.map(normalizeLogLine);
            drawerTimer = setTimeout(function () {
                terminal.innerHTML = '';
                normalized.forEach(function (l, idx) {
                    setTimeout(function () {
                        var cls = l.type === 'ok' ? 'term-ok' : l.type === 'warn' ? 'term-warn' : l.type === 'error' ? 'term-error' : 'term-info';
                        var label = l.type.toUpperCase();
                        if (l.type === 'ok') label = 'INFO';
                        terminal.innerHTML += '<div class="term-line"><span class="term-ts">[' + l.stamp + ']</span> <span class="' + cls + '">' + label + ':</span> ' + l.text + '</div>';
                        var el = drawer.querySelector('.drawer-scroll');
                        if (el) el.scrollTop = el.scrollHeight;
                    }, 120 * (idx + 1));
                });
            }, 400);
        }).catch(function (err) {
            drawerTimer = setTimeout(function () {
                terminal.innerHTML = '<div class="term-line"><span class="term-ts">[--:--:--]</span> <span class="term-error">ERROR:</span> Failed to load log. ' + ((err && err.message) ? err.message : '') + '</div>';
            }, 400);
        });
    }

    function closeDrawer() {
        var backdrop = document.getElementById('drawer-backdrop');
        var drawer = document.getElementById('log-drawer');
        if (!drawer) return;
        drawer.classList.remove('open');
        clearTimeout(drawerTimer);
        setTimeout(function () {
            drawer.hidden = true;
            if (backdrop) backdrop.hidden = true;
        }, 280);
    }

    function terminalText() {
        var terminal = document.getElementById('terminal');
        if (!terminal) return '';
        return Array.prototype.map.call(terminal.querySelectorAll('.term-line'), function (line) {
            return line.textContent;
        }).join('\n');
    }

    function copyToClipboard(text, done, failed) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done, failed); });
        } else {
            fallbackCopy(text, done, failed);
        }
    }

    function fallbackCopy(text, done, failed) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            done();
        } catch (e) {
            failed();
        }
        document.body.removeChild(ta);
    }

    function loadBackups() {
        var tbody = document.getElementById('backup-tbody');
        if (tbody) tbody.innerHTML = skeletonRowsHtml(7);
        API.get('/admin/backups').then(function (res) {
            var items = (res && Array.isArray(res)) ? res : ((res && res.data) || []);
            BACKUPS = items.map(function (b) {
                var copy = {};
                Object.keys(b).forEach(function (k) { copy[k] = b[k]; });
                if (copy.date) copy.date = new Date(copy.date);
                return copy;
            });
            renderBackups();
        }).catch(function (err) {
            if (tbody) tbody.innerHTML = '<tr class="empty-row"><td colspan="7">Failed to load backups. ' + ((err && err.message) ? err.message : 'Server unreachable.') + '</td></tr>';
            showToast('Failed to load backups.', 'error');
        });
    }

    function loadTasks() {
        var tbody = document.getElementById('task-tbody');
        if (tbody) tbody.innerHTML = skeletonRowsHtml(4);
        API.get('/admin/backups/tasks').then(function (res) {
            TASKS = (res && Array.isArray(res)) ? res : ((res && res.data) || []);
            renderTasks();
        }).catch(function () {
            if (tbody) tbody.innerHTML = '<tr class="empty-row"><td colspan="4">Failed to load maintenance tasks.</td></tr>';
            showToast('Failed to load maintenance tasks.', 'error');
        });
    }

    function loadHealth() {
        var list = document.getElementById('health-list');
        if (list) {
            list.innerHTML = '<div class="health-metric" style="padding:16px 0"><div class="skeleton row-skel" style="margin-right:auto;width:60%"></div><div class="skeleton row-skel" style="width:30%"></div></div>';
        }
        API.get('/admin/backups/health').then(function (res) {
            HEALTH = (res && Array.isArray(res)) ? res : ((res && res.data) || []);
            renderHealth();
        }).catch(function () {
            renderHealth();
            showToast('Failed to load backup health metrics.', 'error');
        });
    }

    function bindUi() {
        var search = document.getElementById('backup-search');
        if (search) {
            search.addEventListener('input', function () {
                bState.query = search.value;
                bState.page = 1;
                loadBackups();
            });
        }

        var type = document.getElementById('type-filter');
        var status = document.getElementById('status-filter');
        if (type) type.addEventListener('change', function () { bState.type = type.value; bState.page = 1; loadBackups(); });
        if (status) status.addEventListener('change', function () { bState.status = status.value; bState.page = 1; loadBackups(); });

        var pages = document.getElementById('b-pages');
        if (pages) {
            pages.addEventListener('click', function (e) {
                var btn = e.target.closest('.page-num');
                if (btn && !btn.classList.contains('active')) {
                    bState.page = parseInt(btn.getAttribute('data-page'), 10);
                    loadBackups();
                }
            });
        }

        var prev = document.getElementById('b-prev');
        var next = document.getElementById('b-next');
        if (prev) prev.addEventListener('click', function () { if (bState.page > 1) { bState.page--; loadBackups(); } });
        if (next) next.addEventListener('click', function () { if (bState.page < bTotal) { bState.page++; loadBackups(); } });

        var trigger = document.getElementById('trigger-btn');
        if (trigger) {
            trigger.addEventListener('click', function () {
                trigger.classList.add('btn-spin');
                trigger.setAttribute('aria-busy', 'true');
                var label = trigger.innerHTML;
                trigger.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin" aria-hidden="true"></i> Triggering Backups...';
                API.post('/admin/backups/trigger').then(function () {
                    trigger.classList.remove('btn-spin');
                    trigger.setAttribute('aria-busy', 'false');
                    trigger.innerHTML = label;
                    showToast('Backup triggered. Monitor the console log for progress.', 'success');
                    loadBackups();
                }).catch(function () {
                    trigger.classList.remove('btn-spin');
                    trigger.setAttribute('aria-busy', 'false');
                    trigger.innerHTML = label;
                    showToast('Failed to trigger backup.', 'error');
                });
            });
        }

        var backupTbody = document.getElementById('backup-tbody');
        if (backupTbody) {
            backupTbody.addEventListener('click', function (e) {
                var btn = e.target.closest('[data-logs]');
                if (btn) openDrawer(btn.getAttribute('data-logs'));
            });
        }

        var taskTbody = document.getElementById('task-tbody');
        if (taskTbody) {
            taskTbody.addEventListener('click', function (e) {
                var btn = e.target.closest('[data-task]');
                if (!btn) return;
                var name = btn.getAttribute('data-task');
                if (btn.querySelector('.fa-eye')) {
                    openDrawer(null, name);
                } else {
                    API.post('/admin/backups/tasks/' + encodeURIComponent(name) + '/run').then(function () {
                        showToast('"' + name + '" task started.', 'success');
                        loadTasks();
                    }).catch(function () {
                        showToast('Failed to start task "' + name + '".', 'error');
                    });
                }
            });
        }

        var drawerClose = document.getElementById('drawer-close');
        var closeBtn = document.getElementById('close-btn');
        var backdrop = document.getElementById('drawer-backdrop');
        if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
        if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
        if (backdrop) backdrop.addEventListener('click', closeDrawer);

        var copyBtn = document.getElementById('copy-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', function () {
                var text = terminalText() || 'No log output available yet.';
                copyBtn.classList.add('btn-spin');
                copyToClipboard(text, function () {
                    copyBtn.classList.remove('btn-spin');
                    showToast('Backup log copied to clipboard.', 'success');
                }, function () {
                    copyBtn.classList.remove('btn-spin');
                    showToast('Could not copy the log automatically.', 'error');
                });
            });
        }

        var downloadBtn = document.getElementById('download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', function () {
                downloadBtn.classList.add('btn-spin');
                showToast('Preparing ' + (currentBackupId || 'backup') + ' log file...', '');
                setTimeout(function () {
                    downloadBtn.classList.remove('btn-spin');
                    showToast('Log file download ready.', 'success');
                }, 900);
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        bindUi();
        updateSysTime();
        loadBackups();
        loadTasks();
        loadHealth();
    });
})();