document.addEventListener('DOMContentLoaded', function () {
    const calendarContainer = document.querySelector('.github-calendar');

    // --- MODAL LOGIC ---

    // Project Modals Setup
    function setupProjectModal(boxId, modalId) {
        const box = document.getElementById(boxId);
        const modal = document.getElementById(modalId);
        if (!box || !modal) return;

        const closeBtn = modal.querySelector('.close-project-modal');
        const boxImg = box.querySelector('img');
        const modalImg = modal.querySelector('.project-modal-img');

        box.addEventListener('click', () => {
            // Sync image from box to modal
            if (boxImg && modalImg) {
                modalImg.src = boxImg.src;
            }
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
        });

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            });
        }

        // Close on window click
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }
        });
    }

    setupProjectModal('tfidf-box', 'projectModal');
    setupProjectModal('parchment-box', 'parchmentModal');
    setupProjectModal('mllib-box', 'mllibModal');

    // Generic Image Modal (Certificates)
    const modal = document.getElementById('modal');
    const modalImg = document.getElementById('modal-img');
    const closeBtn = document.querySelector('.close');
    const certificates = document.querySelectorAll('.certificates img');

    certificates.forEach(img => {
        img.addEventListener('click', () => {
            if (modal && modalImg) {
                modal.style.display = "block";
                modalImg.src = img.src;
            }
        });
    });

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = "none";
        });
    }

    // Close Generic Modal on Window Click
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    // --- CALENDAR LOGIC (Robust Implementation) ---

    function styleCalendar() {
        const svg = calendarContainer.querySelector('svg');
        if (svg) {
            svg.style.overflow = 'visible';
            const g = svg.querySelector('g');
            if (g) {
                g.setAttribute('transform', 'translate(45, 30)');
            }

            const rects = svg.querySelectorAll('rect.ContributionCalendar-day, rect.day');
            rects.forEach(rect => {
                const count = rect.getAttribute('data-count');
                const level = rect.getAttribute('data-level');
                rect.style.setProperty('rx', '2px', 'important');
                if (count === '0' || level === '0') {
                    rect.style.setProperty('fill', '#1a1a1a', 'important');
                    rect.setAttribute('fill', '#1a1a1a');
                }
            });

            const legendItems = calendarContainer.querySelectorAll('.contrib-legend li');
            if (legendItems.length > 0) {
                legendItems[0].style.setProperty('background-color', '#1a1a1a', 'important');
            }
        }
    }

    if (calendarContainer) {
        // Initialize with standard options
        try {
            GitHubCalendar(".github-calendar", "KaunAnkit", {
                responsive: true,
                tooltips: true
            });

            // Poll for SVG injection to apply custom styles
            let retryCount = 0;
            const checkExist = setInterval(() => {
                if (calendarContainer.querySelector('svg')) {
                    styleCalendar();
                    clearInterval(checkExist);
                } else if (retryCount > 50) { // Stop after 5 seconds
                    clearInterval(checkExist);
                }
                retryCount++;
            }, 100);

        } catch (err) {
            console.error("GitHub Calendar failed to load:", err);
            calendarContainer.innerHTML = '<p style="color: grey; text-align: center;">Unable to load GitHub calendar. Please check back later.</p>';
        }
    }
});
