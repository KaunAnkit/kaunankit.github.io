const modal = document.getElementById('modal');
const modalImg = document.getElementById('modal-img');
const closeBtn = document.getElementsByClassName('close')[0];

const projectModal = document.getElementById('projectModal');
const tfidfBox = document.getElementById('tfidf-box');
const closeProjectBtn = document.getElementsByClassName('close-project-modal')[0];

// Certificate modal functionality
document.querySelectorAll('.certificates img').forEach(img => {
    img.onclick = function() {
        if (modal) {
            modal.style.display = 'block';
            modalImg.src = this.src;
        }
    }
});

if (closeBtn) {
    closeBtn.onclick = function() {
        modal.style.display = 'none';
    }
}

// Project modal functionality
if (tfidfBox) {
    tfidfBox.onclick = function() {
        projectModal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

if (closeProjectBtn) {
    closeProjectBtn.onclick = function() {
        projectModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// Handle clicks outside modals
window.onclick = function(event) {
    if (projectModal && event.target == projectModal) {
        projectModal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
    if (modal && event.target == modal) {
        modal.style.display = 'none';
    }
}

// Load stats cards on page load
document.addEventListener('DOMContentLoaded', function() {
    // Page loaded
});

function displayLeetCodeStats(data) {
    const statsDiv = document.getElementById('leetcode-stats');
    if (!statsDiv) return;
    
    if (data.status === 'success' || data.totalSolved) {
        let html = '<div class="leetcode-card"><div class="stat-item"><span class="stat-label">Total Solved</span><span class="stat-value">' + data.totalSolved + '</span></div>';
        html += '<div style="margin-top: 20px;"><h4 style="color: #e6edf3; margin-top: 0;">By Difficulty</h4>';
        html += '<div class="difficulty-item"><span class="difficulty-label"><span class="difficulty-dot easy"></span>Easy</span><span class="difficulty-count">' + data.easySolved + '</span></div>';
        html += '<div class="difficulty-item"><span class="difficulty-label"><span class="difficulty-dot medium"></span>Medium</span><span class="difficulty-count">' + data.mediumSolved + '</span></div>';
        html += '<div class="difficulty-item"><span class="difficulty-label"><span class="difficulty-dot hard"></span>Hard</span><span class="difficulty-count">' + data.hardSolved + '</span></div></div></div>';
        statsDiv.innerHTML = html;
    }
}

function displayLeetCodeStatsGraphQL(matchedUser) {
    const statsDiv = document.getElementById('leetcode-stats');
    if (!statsDiv) return;
    
    const acSubmissionNum = matchedUser.submitStats.acSubmissionNum;
    let totalSolved = 0, easy = 0, medium = 0, hard = 0;
    
    acSubmissionNum.forEach(item => {
        totalSolved += item.count;
        if (item.difficulty === 'Easy') easy = item.count;
        if (item.difficulty === 'Medium') medium = item.count;
        if (item.difficulty === 'Hard') hard = item.count;
    });
    
    let html = '<div class="leetcode-card"><div class="stat-item"><span class="stat-label">Total Solved</span><span class="stat-value">' + totalSolved + '</span></div>';
    html += '<div style="margin-top: 20px;"><h4 style="color: #e6edf3; margin-top: 0;">By Difficulty</h4>';
    html += '<div class="difficulty-item"><span class="difficulty-label"><span class="difficulty-dot easy"></span>Easy</span><span class="difficulty-count">' + easy + '</span></div>';
    html += '<div class="difficulty-item"><span class="difficulty-label"><span class="difficulty-dot medium"></span>Medium</span><span class="difficulty-count">' + medium + '</span></div>';
    html += '<div class="difficulty-item"><span class="difficulty-label"><span class="difficulty-dot hard"></span>Hard</span><span class="difficulty-count">' + hard + '</span></div></div></div>';
    statsDiv.innerHTML = html;
}

function showLeetCodeError() {
    loadStatsCards();
}