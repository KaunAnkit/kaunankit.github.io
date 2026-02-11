document.addEventListener('DOMContentLoaded', function () {
    const calendarContainer = document.querySelector('.github-calendar');
    const projectModal = document.getElementById('projectModal');
    const closeProjectModal = document.querySelector('.close-project-modal');
    const projectBox = document.getElementById('tfidf-box');

    // --- MODAL LOGIC ---

    // Project Modal (Search Engine Tf-IDF)
    if (projectBox && projectModal) {
        projectBox.addEventListener('click', () => {
            projectModal.style.display = 'flex';
            setTimeout(() => {
                projectModal.classList.add('show');
            }, 10);
        });
    }

    if (closeProjectModal && projectModal) {
        closeProjectModal.addEventListener('click', () => {
            projectModal.classList.remove('show');
            setTimeout(() => {
                projectModal.style.display = 'none';
            }, 300);
        });
    }

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

    // Close Modals on Window Click
    window.addEventListener('click', (event) => {
        if (event.target === projectModal) {
            projectModal.classList.remove('show');
            setTimeout(() => {
                projectModal.style.display = 'none';
            }, 300);
        }
        if (event.target === modal) {
            modal.style.display = "none";
        }
    });

    // --- CALENDAR LOGIC (Nuclear Fix) ---

    // Observer to fix SVG, remove titles, and lock colors
    const observer = new MutationObserver(() => {
        // PHYSICALLY REMOVE titles to ensure they don't reappear
        const titles = calendarContainer.querySelectorAll('h2, h3, .calendar-graph-title, .f4, .contribution-graph > h2, .contribution-graph > h3');
        titles.forEach(t => t.remove());

        const svg = calendarContainer.querySelector('svg');
        if (svg) {
            svg.style.overflow = 'visible';
            const g = svg.querySelector('g');
            if (g && g.getAttribute('transform')) {
                // Ensure translation is always correct for Mon, Wed, Fri spacing
                g.setAttribute('transform', 'translate(40, 25)');
            }

            // Forcefully lock empty square colors using !important inline
            const rects = svg.querySelectorAll('rect.ContributionCalendar-day, rect.day');
            rects.forEach(rect => {
                const count = rect.getAttribute('data-count');
                const level = rect.getAttribute('data-level');
                if (count === '0' || level === '0') {
                    rect.style.setProperty('fill', 'rgb(109, 108, 108)', 'important');
                    rect.setAttribute('fill', 'rgb(109, 108, 108)');
                }
            });

            // Sync legend empty square
            const legendItems = calendarContainer.querySelectorAll('.contrib-legend li');
            if (legendItems.length > 0) {
                legendItems[0].style.setProperty('background-color', 'rgb(109, 108, 108)', 'important');
            }
        }
    });

    if (calendarContainer) {
        observer.observe(calendarContainer, { childList: true, subtree: true });

        // Backup redundancy for persistent libraries
        setInterval(() => {
            const titles = calendarContainer.querySelectorAll('h2, h3, .calendar-graph-title, .f4, .contribution-graph > h2, .contribution-graph > h3');
            titles.forEach(t => t.remove());
        }, 500);
    }

    // Initialize GitHub Calendar
    try {
        GitHubCalendar(".github-calendar", "KaunAnkit", {
            responsive: true,
            tooltips: true,
            global_stats: false // Disable library stats
        });
    } catch (err) {
        console.error("GitHub Calendar failed to load:", err);
        if (calendarContainer) {
            calendarContainer.innerHTML = '<p style="color: grey; text-align: center;">Unable to load GitHub calendar. Please check back later.</p>';
        }
    }
});
