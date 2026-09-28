(function () {
    'use strict';

    var TIME_SLOTS = [
        '7:00 - 8:30 AM',
        '8:30 - 10:00 AM',
        '10:00 - 11:30 AM',
        '11:30 - 1:00 PM',
        '1:00 - 2:30 PM',
        '2:30 - 4:00 PM',
        '4:00 - 5:30 PM'
    ];

    var DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    var COLUMN_KEYS = ['mon', 'tue', 'wed', 'thu', 'sat'];

    function esc(value) {
        return String(value == null ? '' : value).replace(/[&<>"]/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
        });
    }

    function setText(id, value) {
        var el = document.getElementById(id);
        if (el && value != null && String(value) !== '') el.textContent = String(value);
    }

    function normalizeKey(value) {
        return String(value == null ? '' : value).toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    function dayIndex(value) {
        return indexOfDay(value, DAY_KEYS);
    }

    function columnIndex(value) {
        return indexOfDay(value, COLUMN_KEYS);
    }

    function indexOfDay(value, keys) {
        var key = String(value == null ? '' : value).toLowerCase().replace(/[^a-z]/g, '');
        for (var i = 0; i < keys.length; i += 1) {
            if (key.indexOf(keys[i]) === 0) return i;
        }
        return -1;
    }

    function timeIndex(value) {
        var key = normalizeKey(value);
        for (var i = 0; i < TIME_SLOTS.length; i += 1) {
            if (normalizeKey(TIME_SLOTS[i]) === key) return i;
        }
        return -1;
    }

    function startMinutes(value) {
        var matches = String(value == null ? '' : value).match(/(\d{1,2}):(\d{2})\s*([AP]M)?/g);
        if (!matches || !matches.length) return null;
        var first = matches[0].match(/(\d{1,2}):(\d{2})\s*([AP]M)?/);
        var meridiem = first[3];
        if (!meridiem && matches.length > 1) {
            var second = matches[1].match(/([AP]M)/);
            meridiem = second ? second[1] : null;
        }
        var hour = Number(first[1]);
        if (meridiem && meridiem.toUpperCase() === 'PM' && hour < 12) hour += 12;
        if (meridiem && meridiem.toUpperCase() === 'AM' && hour === 12) hour = 0;
        return hour * 60 + Number(first[2]);
    }

    function timeLabel(value) {
        var first = String(value == null ? '' : value).split('-')[0].trim();
        return first || '';
    }

    function dayKeyOfToday() {
        return DAY_KEYS[(new Date().getDay() + 6) % 7];
    }

    function renderCalendar() {
        var grid = document.getElementById('calendarGrid');
        if (!grid) return;
        var now = new Date();
        var year = now.getFullYear();
        var month = now.getMonth();
        var today = now.getDate();
        var lead = (new Date(year, month, 1).getDay() + 6) % 7;
        var total = new Date(year, month + 1, 0).getDate();
        var html = '';
        for (var i = 0; i < lead; i += 1) {
            html += '<span class="day empty"></span>';
        }
        for (var d = 1; d <= total; d += 1) {
            html += '<span class="day' + (d === today ? ' today active' : '') + '">' + d + '</span>';
        }
        var tail = (7 - ((lead + total) % 7)) % 7;
        for (var t = 0; t < tail; t += 1) {
            html += '<span class="day empty"></span>';
        }
        grid.insertAdjacentHTML('beforeend', html);
    }

    function scheduleEntries(schedule) {
        var entries = [];
        (schedule || []).forEach(function (day) {
            ((day && day.slots) || []).forEach(function (slot) {
                if (!slot) return;
                entries.push({
                    day: day.day,
                    time: slot.time,
                    code: slot.code,
                    title: slot.title,
                    room: slot.room
                });
            });
        });
        return entries;
    }

    function renderSchedule(schedule) {
        var tbody = document.getElementById('scheduleBody');
        if (!tbody) return;
        scheduleEntries(schedule).forEach(function (entry) {
            var di = columnIndex(entry.day);
            var ti = timeIndex(entry.time);
            if (di < 0 || ti < 0 || !tbody.rows[ti]) return;
            var cell = tbody.rows[ti].cells[di + 1];
            if (!cell) return;
            cell.innerHTML = esc(entry.code) + ' &middot; ' + esc(entry.title) +
                (entry.room ? '<br><small>' + esc(entry.room) + '</small>' : '');
        });
    }

    function renderTodayClasses(schedule) {
        var list = document.getElementById('todayClasses');
        if (!list) return;
        var entries = scheduleEntries(schedule);
        var today = dayKeyOfToday();
        var todays = entries.filter(function (e) { return dayIndex(e.day) === DAY_KEYS.indexOf(today); });
        if (!todays.length) todays = entries;
        var nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
        var upcoming = todays.filter(function (e) {
            var start = startMinutes(e.time);
            return start === null || start >= nowMinutes;
        });
        if (!upcoming.length) upcoming = todays;
        if (!upcoming.length) {
            list.innerHTML = '<li class="list-empty">No classes scheduled.</li>';
            return;
        }
        list.innerHTML = upcoming.slice(0, 4).map(function (entry) {
            return '<li><span class="event-date sm">' + esc(timeLabel(entry.time)) + '</span>' +
                '<div class="event-info"><strong>' + esc(entry.code) + '</strong>' +
                '<small>' + esc(entry.title) + (entry.room ? ' &middot; ' + esc(entry.room) : '') + '</small></div></li>';
        }).join('');
    }

    function dayNumber(date) {
        var parsed = new Date(date);
        if (!isNaN(parsed.getTime())) return String(parsed.getDate());
        var first = String(date == null ? '' : date).split(' ')[0];
        return /^\d+$/.test(first) ? first : '';
    }

    function whenLabel(date) {
        var parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
            return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        }
        return String(date == null ? '' : date);
    }

    function renderAnnouncements(items) {
        var list = document.getElementById('announcementList');
        if (!list) return;
        var rows = (items || []).slice(0, 5);
        if (!rows.length) {
            list.innerHTML = '<li class="list-empty">No announcements yet.</li>';
            return;
        }
        list.innerHTML = rows.map(function (a) {
            var subject = a.subject || a.title || '';
            var excerpt = a.excerpt || a.summary || '';
            return '<li><a href="../announcements/announcements.html">' +
                '<span class="event-date">' + esc(dayNumber(a.date)) + '</span>' +
                '<div class="event-info"><strong>' + esc(subject) + '</strong>' +
                (excerpt ? '<small>' + esc(excerpt) + '</small>' : '') + '</div>' +
                '<span class="event-when">' + esc(whenLabel(a.date)) + '</span></a></li>';
        }).join('');
    }

    function renderUser(name) {
        if (!name) return;
        var strong = document.querySelector('.app-user-text strong');
        var avatar = document.querySelector('.app-user-avatar');
        if (strong && !strong.textContent.trim()) {
            strong.textContent = name;
            if (avatar) {
                avatar.textContent = String(name).split(/\s+/).filter(Boolean).slice(0, 2)
                    .map(function (w) { return w.charAt(0); }).join('').toUpperCase();
            }
        }
        var banner = document.getElementById('dashboardName');
        if (banner) banner.textContent = ', ' + name;
    }

    function isNegative(value) {
        return /^\s*[-−(]/.test(String(value == null ? '' : value));
    }

    function isSettled(value) {
        return /^\s*[-−(]?(0|0\.0+|paid|settled|cleared|none|n\/a)\b/i.test(String(value == null ? '' : value));
    }

    function setTone(id, value, negativeIsBad) {
        var el = document.getElementById(id);
        if (!el) return;
        var bad = negativeIsBad ? isNegative(value) : !isSettled(value);
        el.classList.toggle('due', bad);
        el.classList.toggle('good', !bad);
    }

    function renderSummary(res) {
        var d = (res && res.data) ? res.data : (res || {});
        setText('dashboardCourse', d.course);
        setText('statGpa', d.gpa);
        setText('statGpaChange', d.gpaChange);
        setText('statBalance', d.balance);
        setText('statBalanceDue', d.balanceDue);
        setText('statUnits', d.enrolledUnits);
        setText('statAnnouncements', d.unreadAnnouncements);
        setTone('statGpaChange', d.gpaChange, true);
        setTone('statBalanceDue', d.balanceDue, false);
        renderUser(d.name);
        renderSchedule(d.schedule);
        renderTodayClasses(d.schedule);
        renderAnnouncements(d.announcements);
    }

    document.addEventListener('DOMContentLoaded', function () {
        renderCalendar();
        if (!window.API) return;
        API.get('/student/dashboard/summary').then(renderSummary).catch(function () {
            renderTodayClasses([]);
            renderAnnouncements([]);
            if (window.showToast) showToast('Failed to load dashboard summary', 'error');
        });
    });
})();
