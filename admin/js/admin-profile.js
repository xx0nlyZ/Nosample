/* ==========================================================================
   CEC ADMIN PORTAL - PROFILE VIEWS
   Copy-to-clipboard, avatar upload preview, and profile form handling.
   ========================================================================== */
(function () {
    'use strict';

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

    function copyText(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }

        return new Promise(function (resolve, reject) {
            var input = document.createElement('textarea');
            input.value = text;
            input.style.position = 'fixed';
            input.style.opacity = '0';
            document.body.appendChild(input);
            input.select();
            try {
                document.execCommand('copy');
                resolve();
            } catch (err) {
                reject(err);
            } finally {
                document.body.removeChild(input);
            }
        });
    }

    function handleCopyButtons() {
        var buttons = document.querySelectorAll('.copy-btn');
        Array.prototype.forEach.call(buttons, function (btn) {
            btn.addEventListener('click', function () {
                var value = btn.getAttribute('data-copy');
                if (!value) return;

                var original = btn.innerHTML;
                copyText(value)
                    .then(function () {
                        btn.classList.add('copied');
                        btn.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i>';
                        setTimeout(function () {
                            btn.classList.remove('copied');
                            btn.innerHTML = original;
                        }, 1600);
                    })
                    .catch(function () {
                        showToast('Unable to copy. Select and copy the value manually.', 'error');
                    });
            });
        });
    }

    /* ------------------------------------------------------------------
       Avatar upload preview (details + edit pages)
       ------------------------------------------------------------------ */
    function handleAvatarUpload() {
        var input = document.querySelector('#avatar-input');
        var avatar = document.querySelector('#hero-avatar');
        var initialsEl = document.querySelector('#avatar-initials');
        var img = document.querySelector('#avatar-img');
        if (!input || !avatar) return;

        var triggers = document.querySelectorAll('.avatar-trigger');
        Array.prototype.forEach.call(triggers, function (trigger) {
            trigger.addEventListener('click', function () {
                input.click();
            });
        });

        input.addEventListener('change', function () {
            var file = input.files && input.files[0];
            if (!file) return;

            if (!file.type.match(/^image\//)) {
                showToast('Please choose an image file.', 'error');
                input.value = '';
                return;
            }

            var reader = new FileReader();
            reader.onload = function (e) {
                if (img) {
                    img.src = e.target.result;
                    img.hidden = false;
                }
                if (initialsEl) {
                    initialsEl.hidden = true;
                }
                avatar.style.backgroundImage = 'url("' + e.target.result + '")';
                avatar.style.backgroundSize = 'cover';
                avatar.style.backgroundPosition = 'center';
                showToast('New profile picture ready to preview.', 'success');
            };
            reader.readAsDataURL(file);
        });
    }

    function initials(name) {
        return String(name || '').split(/\s+/).filter(function (p) { return p; })
            .slice(0, 2).map(function (p) { return p[0].toUpperCase(); })
            .join('') || 'A';
    }

    function setValue(id, value) {
        var el = document.getElementById(id);
        if (el && value) el.value = value;
    }

    function setText(id, value) {
        var el = document.getElementById(id);
        if (el) el.textContent = value || '';
    }

    function setCopy(id, value) {
        var row = document.getElementById(id);
        if (!row) return;
        Array.prototype.forEach.call(row.querySelectorAll('.copy-value'), function (el) { el.textContent = value; });
        Array.prototype.forEach.call(row.querySelectorAll('.copy-btn'), function (btn) { if (value) btn.setAttribute('data-copy', value); });
    }

    function toDateInput(value) {
        var date = new Date(value);
        if (isNaN(date.getTime())) return value || '';
        var m = String(date.getMonth() + 1).padStart(2, '0');
        var d = String(date.getDate()).padStart(2, '0');
        return date.getFullYear() + '-' + m + '-' + d;
    }

    /* ------------------------------------------------------------------
       Profile details view: fill values from the API
       ------------------------------------------------------------------ */
    function fillDetails(p) {
        if (!p) return;

        if (p.fullName) {
            setText('hero-name', p.fullName);
            setText('avatar-initials', initials(p.fullName));
            setText('detail-name', p.fullName);
        }

        var email = p.workEmail || p.email;
        if (email) setCopy('copy-email', email);

        if (p.userId) setCopy('copy-uid', p.userId);

        if (p.contactNumber) setText('profile-contact-value', p.contactNumber);
        if (p.role || p.rolePermissions) setText('profile-role-value', p.rolePermissions || p.role);
        if (p.department) setText('profile-department-value', p.department);
        if (p.joinDate) setText('detail-join', fmtHumanDate(p.joinDate));
        if (p.address) setText('detail-address', p.address);
        if (p.birthDate) setText('detail-birth', fmtHumanDate(p.birthDate));
    }

    function fmtHumanDate(value) {
        var date = new Date(value);
        if (isNaN(date.getTime())) return value;
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var h = date.getHours();
        var ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return months[date.getMonth()] + ' ' + pad(date.getDate()) + ', ' + date.getFullYear();
    }

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    function loadProfile() {
        if (typeof API === 'undefined') return;
        API.get('/admin/profile').then(function (profile) {
            fillDetails(profile || {});
        }).catch(function () {
            showToast('Failed to load profile.', 'error');
        });
    }

    /* ------------------------------------------------------------------
       Edit profile form: prefill + save via the API
       ------------------------------------------------------------------ */
    function prefillEditForm(p) {
        if (!p) return;
        setValue('work-email', p.workEmail || p.email);
        setValue('assign-user-id', p.userId);
        setValue('contact-number', p.contactNumber);
        setValue('full-name', p.fullName);
        setValue('join-date', toDateInput(p.joinDate));
        setValue('address', p.address);
        setValue('birth-date', toDateInput(p.birthDate));

        if (p.rolePermissions) setSelect('role-permissions', p.rolePermissions);
        if (p.department) setSelect('department', p.department);

        var hero = document.querySelector('.hero-name');
        if (hero && p.fullName) hero.textContent = p.fullName;
        var initialsEl = document.getElementById('avatar-initials');
        if (initialsEl && p.fullName) initialsEl.textContent = initials(p.fullName);
    }

    function setSelect(id, value) {
        var el = document.getElementById(id);
        if (!el) return;
        for (var i = 0; i < el.options.length; i++) {
            var opt = el.options[i];
            if (opt.value === value || opt.text === value) {
                el.selectedIndex = i;
                return;
            }
        }
    }

    function handleEditForm() {
        var form = document.querySelector('#edit-profile-form');
        if (!form) return;

        var submitBtn = document.querySelector('button[form="edit-profile-form"]');
        var errorMessages = form.querySelectorAll('.error-msg');

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            Array.prototype.forEach.call(errorMessages, function (el) {
                el.hidden = true;
            });

            var firstInvalid = null;
            Array.prototype.forEach.call(form.elements, function (el) {
                if (el.disabled) return;
                if (!el.checkValidity()) {
                    el.classList.add('invalid');
                    var errorEl = form.querySelector('[data-error-for="' + el.name + '"]');
                    if (errorEl) errorEl.hidden = false;
                    if (!firstInvalid) firstInvalid = el;
                } else {
                    el.classList.remove('invalid');
                }
            });

            if (firstInvalid) {
                firstInvalid.focus();
                showToast('Please complete the highlighted fields.', 'error');
                return;
            }

            var body = {
                fullName: value('full-name'),
                contactNumber: value('contact-number'),
                rolePermissions: value('role-permissions'),
                department: value('department'),
                joinDate: value('join-date'),
                address: value('address'),
                birthDate: value('birth-date')
            };

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Saving...';
            }

            API.put('/admin/profile', body).then(function () {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk" aria-hidden="true"></i> Save Changes';
                }
                showToast('Profile updated successfully.', 'success');
            }).catch(function () {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk" aria-hidden="true"></i> Save Changes';
                }
                showToast('Failed to update profile.', 'error');
            });
        });

        if (typeof API !== 'undefined') {
            API.get('/admin/profile').then(function (profile) {
                prefillEditForm(profile || {});
            }).catch(function () {
                showToast('Failed to load profile.', 'error');
            });
        }
    }

    function value(id) {
        var el = document.getElementById(id);
        return el ? el.value.trim() : '';
    }

    document.addEventListener('DOMContentLoaded', function () {
        handleCopyButtons();
        handleAvatarUpload();
        handleEditForm();
        loadProfile();
    });
})();