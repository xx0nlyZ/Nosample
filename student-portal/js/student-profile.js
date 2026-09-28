const profileTabs = document.querySelectorAll('.profile-tabs a');
const profileSections = document.querySelectorAll('.profile-tab-content');
const profileNote = document.querySelector('#profile-note');

profileTabs.forEach((tab) => {
    tab.addEventListener('click', (event) => {
        event.preventDefault();

        profileTabs.forEach((item) => item.classList.remove('active'));
        profileSections.forEach((section) => {
            section.hidden = true;
        });

        tab.classList.add('active');
        const target = document.querySelector(tab.getAttribute('href'));
        if (target) {
            target.hidden = false;
        }

        if (profileNote) {
            profileNote.textContent = tab.dataset.note || "For changes in personal data, please submit a request to the Registrar's Office.";
        }
    });
});