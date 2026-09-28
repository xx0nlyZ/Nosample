(function () {
    'use strict';

    var currentProfile = null;

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

    function setStatusTint() {
        var status = document.getElementById('status');
        if (!status) return;
        status.className = 'form-select status-select status-' + status.value.toLowerCase();
    }

    function applyProfile(profile) {
        currentProfile = profile;
        setValue('user-id', profile.userId);
        setValue('full-name', profile.fullName);
        setSelectValue('role', profile.role);
        setSelectValue('status', profile.status);
        setValue('email', profile.email);
        setValue('contact-number', profile.contactNumber);
        setStatusTint();
    }

    function setValue(id, value) {
        var el = document.getElementById(id);
        if (el) el.value = value || '';
    }

    function setSelectValue(id, value) {
        var el = document.getElementById(id);
        if (!el) return;
        for (var i = 0; i < el.options.length; i++) {
            if (el.options[i].value === value) {
                el.selectedIndex = i;
                return;
            }
        }
    }

    function resetAvatar() {
        var img = document.getElementById('avatar-img');
        var icon = document.getElementById('avatar-icon');
        var remove = document.getElementById('remove-btn');
        if (img) {
            img.removeAttribute('src');
            img.hidden = true;
        }
        if (icon) icon.hidden = false;
        if (remove) remove.hidden = true;
        var file = document.getElementById('avatar-file');
        if (file) file.value = '';
    }

    function bindAvatar() {
        var upload = document.getElementById('upload-btn');
        var file = document.getElementById('avatar-file');
        var remove = document.getElementById('remove-btn');
        var img = document.getElementById('avatar-img');
        var icon = document.getElementById('avatar-icon');

        if (upload && file) {
            upload.addEventListener('click', function () { file.click(); });
        }

        if (file) {
            file.addEventListener('change', function () {
                var chosen = file.files && file.files[0];
                if (!chosen) return;
                if (chosen.size > 5 * 1024 * 1024) {
                    showToast('Image is too large. Maximum size is 5 MB.', 'error');
                    file.value = '';
                    return;
                }
                var reader = new FileReader();
                reader.onload = function (e) {
                    if (img) {
                        img.src = e.target.result;
                        img.hidden = false;
                    }
                    if (icon) icon.hidden = true;
                    if (remove) remove.hidden = false;
                    showToast('New profile picture selected.', '');
                };
                reader.readAsDataURL(chosen);
            });
        }

        if (remove) {
            remove.addEventListener('click', function () {
                resetAvatar();
                showToast('Profile picture removed.', '');
            });
        }
    }

    function loadProfile() {
        var userId = params().get('userId');
        if (!userId) {
            showToast('No user specified.', 'error');
            return;
        }
        API.get('/admin/users/' + encodeURIComponent(userId)).then(function (profile) {
            applyProfile(profile || {});
        }).catch(function () {
            showToast('Failed to load user profile.', 'error');
        });
    }

    function bindUi() {
        var status = document.getElementById('status');
        if (status) {
            status.addEventListener('change', setStatusTint);
        }

        var discard = document.getElementById('discard-btn');
        if (discard) {
            discard.addEventListener('click', function () {
                if (currentProfile) applyProfile(currentProfile);
                resetAvatar();
                showToast('Changes discarded.', '');
            });
        }

        var save = document.getElementById('save-btn');
        var form = document.getElementById('edit-user-form');
        if (form) {
            form.addEventListener('submit', function (e) { e.preventDefault(); });
        }
        if (save) {
            save.addEventListener('click', function () {
                if (!currentProfile || !currentProfile.userId) {
                    showToast('User profile not loaded yet.', 'error');
                    return;
                }
                var name = document.getElementById('full-name');
                var email = document.getElementById('email');
                var contact = document.getElementById('contact-number');

                if (!name || !name.value.trim()) {
                    showToast('Full name is required.', 'error');
                    if (name) name.focus();
                    return;
                }
                if (!email || !/^\S+@\S+\.\S+$/.test(email.value.trim())) {
                    showToast('Enter a valid email address.', 'error');
                    if (email) email.focus();
                    return;
                }
                if (!contact || !contact.value.trim()) {
                    showToast('Contact number is required.', 'error');
                    if (contact) contact.focus();
                    return;
                }

                var roleEl = document.getElementById('role');
                var statusEl = document.getElementById('status');

                var body = {
                    fullName: name.value.trim(),
                    email: email.value.trim(),
                    contactNumber: contact.value.trim(),
                    role: roleEl ? roleEl.value : '',
                    status: statusEl ? statusEl.value : ''
                };

                save.classList.add('btn-spin');
                API.put('/admin/users/' + encodeURIComponent(currentProfile.userId), body).then(function () {
                    save.classList.remove('btn-spin');
                    showToast('Profile updated successfully.', 'success');
                    setTimeout(function () {
                        window.location.href = 'user-management.html';
                    }, 700);
                }).catch(function (err) {
                    save.classList.remove('btn-spin');
                    showToast('Failed to update profile. ' + ((err && err.message) ? err.message : ''), 'error');
                });
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        bindAvatar();
        bindUi();
        loadProfile();
    });
})();