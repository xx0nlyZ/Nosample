(function () {
    'use strict';

    var editId = null;

    var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    function params() {
        return new URLSearchParams(window.location.search);
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

    function setAudience(selected) {
        var pills = document.querySelectorAll('.audience-pill');
        pills.forEach(function (pill) {
            var on = selected.indexOf(pill.getAttribute('data-audience')) !== -1;
            pill.classList.toggle('active', on);
            if (on) {
                pill.innerHTML = pill.getAttribute('data-audience') + ' <i class="fa-solid fa-xmark" aria-hidden="true"></i>';
            } else {
                pill.textContent = pill.getAttribute('data-audience');
            }
        });
    }

    function selectedAudience() {
        return Array.prototype.map.call(document.querySelectorAll('.audience-pill.active'), function (pill) {
            return pill.getAttribute('data-audience');
        });
    }

    function switchMode(mode) {
        var controls = document.getElementById('schedule-controls');
        if (!controls) return;
        controls.classList.toggle('is-now', mode === 'now');
    }

    function formatDateForInput(value) {
        var date = new Date(value);
        if (isNaN(date.getTime())) return value;
        var month = String(date.getMonth() + 1).padStart(2, '0');
        var day = String(date.getDate()).padStart(2, '0');
        return date.getFullYear() + '-' + month + '-' + day;
    }

    function formatTimeForSelect(value) {
        if (!value) return null;
        var date = new Date(value);
        if (!isNaN(date.getTime())) {
            var h = date.getHours();
            var ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12 || 12;
            return String(h).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0') + ' ' + ampm;
        }
        var text = String(value);
        var hasAmpm = /(am|pm)/i.test(text);
        if (hasAmpm) {
            var parts = text.replace(/\s?(am|pm)/i, ' $1').toUpperCase().split(' ');
            var hm = parts[0].split(':');
            var hours = parseInt(hm[0], 10);
            if (parts[1] === 'PM' && hours < 12) hours += 12;
            if (parts[1] === 'AM' && hours === 12) hours = 0;
            return String(hours).padStart(2, '0') + ':' + (hm[1] ? hm[1] : '00') + ' ' + (parts[1] || 'AM');
        }
        return text;
    }

    function loadEditMode() {
        var title = document.getElementById('page-title');
        var desc = document.getElementById('page-desc');
        var cardTitle = document.getElementById('card-title');
        var submitBtn = document.getElementById('submit-btn');
        var subject = document.getElementById('subject');
        var rteArea = document.getElementById('rte-area');

        if (title) title.textContent = 'Edit Announcement';
        if (desc) desc.textContent = 'Update the details of announcement ' + editId + '.';
        if (cardTitle) cardTitle.textContent = 'Edit Announcement Details';
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fa-solid fa-circle-check" aria-hidden="true"></i> Update Announcement';
        }

        API.get('/admin/announcements/' + encodeURIComponent(editId)).then(function (res) {
            var detail = res || {};
            if (subject) subject.value = detail.subject || '';
            if (rteArea) rteArea.innerHTML = detail.content || '';

            if (detail.releaseDate || detail.releaseTime) {
                var html = document.querySelector('input[name="schedule"][value="date"]');
                if (html) html.checked = true;
                switchMode('date');
            }

            if (detail.releaseDate) {
                var dateInput = document.getElementById('release-date');
                if (dateInput) dateInput.value = formatDateForInput(detail.releaseDate);
            }

            var time = document.getElementById('release-time');
            var timeValue = formatTimeForSelect(detail.releaseTime);
            if (time && timeValue) {
                for (var i = 0; i < time.options.length; i++) {
                    if (time.options[i].value === timeValue) {
                        time.selectedIndex = i;
                        break;
                    }
                }
            }

            setAudience(detail.audience || []);
        }).catch(function () {
            showToast('Failed to load announcement.', 'error');
        });
    }

    function execRte(cmd) {
        var area = document.getElementById('rte-area');
        if (!area) return;
        area.focus();
        if (cmd === 'insertImage') {
            var url = window.prompt('Paste an image URL:');
            if (url) document.execCommand('insertImage', false, url);
            return;
        }
        if (cmd === 'undo') {
            document.execCommand('undo');
            return;
        }
        if (cmd === 'redo') {
            document.execCommand('redo');
            return;
        }
        document.execCommand(cmd, false, null);
    }

    function bindRte() {
        document.querySelectorAll('[data-cmd]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                execRte(btn.getAttribute('data-cmd'));
            });
        });

        var color = document.getElementById('text-color');
        if (color) {
            color.addEventListener('input', function () {
                document.execCommand('foreColor', false, color.value);
            });
        }

        var area = document.getElementById('rte-area');
        if (area) {
            area.addEventListener('keyup', function () {
                var cmds = ['bold', 'italic', 'underline', 'strikeThrough', 'justifyLeft', 'justifyCenter', 'justifyRight', 'insertUnorderedList', 'insertOrderedList'];
                cmds.forEach(function (cmd) {
                    var btn = document.querySelector('[data-cmd="' + cmd + '"]');
                    if (!btn) return;
                    var active = false;
                    try {
                        active = document.queryCommandState(cmd);
                    } catch (e) {
                        active = false;
                    }
                    btn.classList.toggle('active', active);
                });
            });
        }
    }

    function bindUi() {
        document.querySelectorAll('input[name="schedule"]').forEach(function (radio) {
            radio.addEventListener('change', function () {
                switchMode(radio.value);
            });
        });

        document.getElementById('audience-list').addEventListener('click', function (e) {
            var pill = e.target.closest('.audience-pill');
            if (!pill) return;
            var value = pill.getAttribute('data-audience');
            var active = pill.classList.contains('active');
            if (active) {
                pill.classList.remove('active');
                pill.textContent = value;
            } else {
                var all = document.querySelector('.audience-pill[data-audience="All Users"]');
                if (value === 'All Users') {
                    document.querySelectorAll('.audience-pill').forEach(function (p) {
                        if (p !== all) {
                            p.classList.remove('active');
                            p.textContent = p.getAttribute('data-audience');
                        }
                    });
                    pill.classList.add('active');
                    pill.innerHTML = value + ' <i class="fa-solid fa-xmark" aria-hidden="true"></i>';
                } else {
                    if (all && all.classList.contains('active')) {
                        all.classList.remove('active');
                        all.textContent = 'All Users';
                    }
                    pill.classList.add('active');
                    pill.innerHTML = value + ' <i class="fa-solid fa-xmark" aria-hidden="true"></i>';
                }
            }
        });

        var cancel = document.getElementById('cancel-btn');
        if (cancel) {
            cancel.addEventListener('click', function () {
                window.location.href = 'announcements.html';
            });
        }

        var submit = document.getElementById('submit-btn');
        if (submit) {
            submit.addEventListener('click', function () {
                var subject = document.getElementById('subject');
                var area = document.getElementById('rte-area');
                if (!subject.value.trim()) {
                    showToast('A subject is required.', 'error');
                    subject.focus();
                    return;
                }
                var audience = selectedAudience();
                if (!audience.length) {
                    showToast('Select at least one target audience.', 'error');
                    return;
                }

                var nowRadio = document.querySelector('input[name="schedule"][value="now"]');
                var isNow = nowRadio ? nowRadio.checked : true;
                var releaseDate = null;
                var releaseTime = null;
                if (!isNow) {
                    var dateInput = document.getElementById('release-date');
                    var timeInput = document.getElementById('release-time');
                    if (dateInput) releaseDate = dateInput.value || null;
                    if (timeInput) releaseTime = timeInput.value || null;
                }

                var body = {
                    subject: subject.value.trim(),
                    audience: audience,
                    content: area.innerHTML,
                    status: isNow ? 'Live' : 'Scheduled',
                    releaseDate: releaseDate,
                    releaseTime: releaseTime
                };

                submit.classList.add('btn-spin');
                var request = editId
                    ? API.put('/admin/announcements/' + encodeURIComponent(editId), body)
                    : API.post('/admin/announcements', body);

                request.then(function () {
                    submit.classList.remove('btn-spin');
                    showToast(editId ? 'Announcement updated successfully.' : 'Announcement posted successfully.', 'success');
                    setTimeout(function () {
                        window.location.href = 'announcements.html';
                    }, 700);
                }).catch(function (err) {
                    submit.classList.remove('btn-spin');
                    showToast('Failed to ' + (editId ? 'update' : 'post') + ' the announcement. ' + ((err && err.message) ? err.message : ''), 'error');
                });
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        editId = params().get('edit') || params().get('id');
        bindRte();
        bindUi();
        if (editId) loadEditMode();
        else setAudience([]);
    });
})();