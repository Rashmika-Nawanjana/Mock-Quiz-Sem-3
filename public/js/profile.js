// Sidebar Navigation Logic
document.addEventListener("DOMContentLoaded", function () {
    // Sidebar navigation: highlight and show correct section
    const navLinks = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    function activateSection(sectionId) {
        // Remove active from all nav and sections
        navLinks.forEach(link => link.classList.remove('active'));
        sections.forEach(sec => sec.classList.remove('active'));
        // Add active to the clicked section and nav link
        document.getElementById(sectionId).classList.add('active');
        document.querySelector(`.nav-item[data-section="${sectionId}"]`).classList.add('active');
        // Scroll to top of main content
        document.querySelector('.main-content').scrollTo({ top: 0, behavior: 'smooth' });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            activateSection(sectionId);
        });
    });

    // Optional: Activate section based on URL hash
    if (window.location.hash) {
        const section = window.location.hash.replace('#', '');
        if (document.getElementById(section)) {
            activateSection(section);
        }
    }

    // Chart.js Analytics
    if (typeof Chart !== "undefined") {
        // Progress Chart
        const progressChartElem = document.getElementById('progressChart');
        if (progressChartElem) {
            new Chart(progressChartElem, {
                type: 'line',
                data: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    datasets: [{
                        label: 'Quiz Scores',
                        data: [65, 75, 80, 85],
                        borderColor: 'rgba(86, 36, 208, 1)',
                        backgroundColor: 'rgba(86, 36, 208, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, max: 100 } }
                }
            });
        }
        // Score Distribution Chart
        const scoreChartElem = document.getElementById('scoreChart');
        if (scoreChartElem) {
            new Chart(scoreChartElem, {
                type: 'doughnut',
                data: {
                    labels: ['90-100%', '80-89%', '70-79%', '60-69%', '<60%'],
                    datasets: [{
                        data: [30, 25, 20, 15, 10],
                        backgroundColor: [
                            '#0ca678', '#f59f00', '#5624d0', '#a435f0', '#fa5252'
                        ],
                        borderWidth: 2,
                        borderColor: 'rgba(255,255,255,0.8)'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } }
                }
            });
        }
        // Module Performance Chart
        const moduleChartElem = document.getElementById('moduleChart');
        if (moduleChartElem) {
            new Chart(moduleChartElem, {
                type: 'bar',
                data: {
                    labels: [
                        'Database Systems', 'Operating Systems', 
                        'Data Structures', 'Software Engineering', 
                        'Computer Networks', 'AI'
                    ],
                    datasets: [{
                        label: 'Average Score',
                        data: [87, 78, 92, 76, 82, 74],
                        backgroundColor: 'rgba(86, 36, 208, 0.8)',
                        borderColor: 'rgba(86, 36, 208, 1)',
                        borderWidth: 2,
                        borderRadius: 8,
                        borderSkipped: false,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, max: 100 } }
                }
            });
        }
    }

    // Quick Actions
    window.startQuiz = function () {
        activateSection('modules');
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    };
    window.viewProgress = function () {
        activateSection('analytics');
    };
    window.reviewMistakes = function () {
        activateSection('recent-attempts');
    };

    // Profile Actions
    window.editProfile = function () {
        activateSection('profile-settings');
    };
    window.editAvatar = function () {
        // Example: open file picker to change avatar
        alert("Avatar upload not implemented in this demo.");
    };
    window.downloadData = function () {
        alert('Data export would be implemented here.');
    };
    window.logout = function () {
        if (confirm('Logout?')) window.location.href = '/logout';
    };

    // Attempt-related actions
    window.viewAllAttempts = function () {
        activateSection('recent-attempts');
    };
    window.viewAttempt = function (attemptId) {
        alert('Go to details for attempt: ' + attemptId);
    };
    window.retakeQuiz = function (quizId) {
        window.location.href = '/quiz/' + quizId;
    };

    // Module-related actions
    window.viewModule = function (moduleId) {
        window.location.href = '/modules/' + moduleId;
    };
    window.viewHistory = function (moduleId) {
        alert('View quiz history for module: ' + moduleId);
    };

    // Animate stat numbers on visible (IntersectionObserver)
    function animateValue(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const current = Math.floor(progress * (end - start) + start);
            element.textContent = current + (element.textContent.includes('%') ? '%' : '');
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
    const stats = document.querySelectorAll('.stat-card h3, .stat-item .stat-number');
    const observer = new window.IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const value = parseInt(el.textContent);
                if (!isNaN(value)) animateValue(el, 0, value, 1200);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.7 });
    stats.forEach(stat => observer.observe(stat));

    // Optionally, add sidebar toggle for mobile (not shown in markup)
    // and highlight nav items on scroll
});