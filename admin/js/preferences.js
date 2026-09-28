/* CEC Admin Portal - User Preferences & Appearance */

(function () {
    'use strict';

    try {
        ['language', 'date-format'].forEach(function (id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('change', function () {
                localStorage.setItem('cec-pref-' + id, el.value);
            });
            var stored = localStorage.getItem('cec-pref-' + id);
            if (stored && [...el.options].some(function (o) { return o.value === stored; })) {
                el.value = stored;
            }
        });
    } catch (err) {
        /* ignore storage errors */
    }

    var themeCards = document.querySelectorAll('.theme-card');
    themeCards.forEach(function (card) {
        card.addEventListener('click', function () {
            themeCards.forEach(function (c) { c.classList.remove('selected'); });
            card.classList.add('selected');
        });
    });

    var swatches = document.querySelectorAll('.swatch');
    swatches.forEach(function (swatch) {
        swatch.addEventListener('click', function () {
            swatches.forEach(function (s) { s.classList.remove('selected'); });
            swatch.classList.add('selected');
        });
    });

    var segBtns = document.querySelectorAll('#font-size-group .seg-btn');
    segBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
            segBtns.forEach(function (b) { b.classList.remove('selected'); });
            btn.classList.add('selected');
        });
    });
})();