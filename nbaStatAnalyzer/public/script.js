// Theme toggle logic
const body = document.body;
const toggleBtn = document.getElementById('themeToggle');

// Set theme from localStorage or default to dark
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    body.classList.add(savedTheme);
    toggleBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
} else {
    body.classList.add('dark');
    toggleBtn.textContent = '☀️';
}

// Toggle theme on button click
toggleBtn.addEventListener('click', () => {
    if (body.classList.contains('dark')) {
        body.classList.remove('dark');
        body.classList.add('light');
        toggleBtn.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.remove('light');
        body.classList.add('dark');
        toggleBtn.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    }
});

// --- Autocomplete logic for player name input ---
const playerInput = document.getElementById('playerName');
const suggestionsDiv = document.getElementById('suggestions');
let suggestions = [];
let selectedIdx = -1;

playerInput.addEventListener('input', async function () {
    const q = playerInput.value.trim();
    if (q.length < 2) {
        suggestionsDiv.innerHTML = '';
        suggestionsDiv.style.display = 'none';
        suggestions = [];
        selectedIdx = -1;
        return;
    }
    const resp = await fetch(`http://127.0.0.1:5000/api/player_suggestions?q=${encodeURIComponent(q)}`);
    suggestions = await resp.json();
    selectedIdx = -1;
    if (suggestions.length) {
        suggestionsDiv.innerHTML = suggestions.map((name, i) =>
            `<div class="suggestion${i === selectedIdx ? ' selected' : ''}" data-idx="${i}">${name}</div>`
        ).join('');
        suggestionsDiv.style.display = 'block';
    } else {
        suggestionsDiv.innerHTML = '';
        suggestionsDiv.style.display = 'none';
    }
});

playerInput.addEventListener('keydown', function (e) {
    if (!suggestions.length || suggestionsDiv.style.display === 'none') return;
    if (e.key === 'ArrowDown') {
        selectedIdx = (selectedIdx + 1) % suggestions.length;
        updateSuggestionSelection();
        e.preventDefault();
    } else if (e.key === 'ArrowUp') {
        selectedIdx = (selectedIdx - 1 + suggestions.length) % suggestions.length;
        updateSuggestionSelection();
        e.preventDefault();
    } else if (e.key === 'Enter') {
        if (selectedIdx >= 0) {
            playerInput.value = suggestions[selectedIdx];
            suggestionsDiv.innerHTML = '';
            suggestionsDiv.style.display = 'none';
        }
    } else if (e.key === 'Escape') {
        suggestionsDiv.innerHTML = '';
        suggestionsDiv.style.display = 'none';
    }
});

suggestionsDiv.addEventListener('mousedown', function (e) {
    if (e.target.classList.contains('suggestion')) {
        const idx = parseInt(e.target.getAttribute('data-idx'));
        playerInput.value = suggestions[idx];
        suggestionsDiv.innerHTML = '';
        suggestionsDiv.style.display = 'none';
        playerInput.focus();
    }
});

playerInput.addEventListener('blur', function () {
    setTimeout(() => {
        suggestionsDiv.innerHTML = '';
        suggestionsDiv.style.display = 'none';
    }, 100);
});

function updateSuggestionSelection() {
    Array.from(suggestionsDiv.children).forEach((el, i) => {
        el.classList.toggle('selected', i === selectedIdx);
    });
}

// --- Player stat fetch (existing logic) ---
document.getElementById('searchForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const playerName = document.getElementById('playerName').value;

    const response = await fetch(`http://127.0.0.1:5000/api/player?name=${encodeURIComponent(playerName)}`);
    const data = await response.json();

    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = "";

    if (data.error) {
        resultDiv.innerHTML = `<p>${data.error}</p>`;
    } else {
        const headshotURL = `https://cdn.nba.com/headshots/nba/latest/1040x760/${data.player_id}.png`;
        const logoURL = `https://cdn.nba.com/logos/nba/${data.team_id}/global/L/logo.svg`;

        const html = `
            <div class="player-card">
                <div class="player-header">
                    <img src="${headshotURL}" alt="Player Headshot">
                    <div>
                        <h2>${data.full_name} (${data.position})</h2>
                        <p>Team: ${data.team}</p>
                        <img src="${logoURL}" alt="Team Logo" style="width: 50px; height: auto;">
                    </div>
                </div>

                <h3 style="margin-top: 10px;">🔥 Last 5 Game Averages</h3>
                <div class="stat-grid">
                    <div class="stat-box">PTS: ${data.last5.PTS}</div>
                    <div class="stat-box">REB: ${data.last5.REB}</div>
                    <div class="stat-box">AST: ${data.last5.AST}</div>
                </div>

                <h3 style="margin-top: 25px;">📊 Career Averages</h3>
                <div class="stat-grid">
                    <div class="stat-box">PTS: ${data.career.PTS}</div>
                    <div class="stat-box">REB: ${data.career.REB}</div>
                    <div class="stat-box">AST: ${data.career.AST}</div>
                </div>
            </div>
        `;

        resultDiv.innerHTML = html;
    }
});