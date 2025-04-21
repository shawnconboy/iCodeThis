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

// Reusable player stat fetcher
async function fetchPlayerStats(name) {
    const response = await fetch(`http://127.0.0.1:5000/api/player?name=${encodeURIComponent(name)}`);
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
}

// Handle search form submit
document.getElementById('searchForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const playerName = document.getElementById('playerName').value;
    fetchPlayerStats(playerName);
});

// Load today's players on homepage
async function loadTodayPlayers() {
    const res = await fetch("http://127.0.0.1:5000/api/today_players");
    const players = await res.json();
    const container = document.getElementById("todayPlayers");
    container.innerHTML = "";

    if (players.length === 0) {
        container.innerHTML = "<p style='text-align:center;'>No top players in action today.</p>";
        return;
    }

    players.forEach(player => {
        const headshot = `https://cdn.nba.com/headshots/nba/latest/1040x760/${player.player_id}.png`;
        const logo = `https://cdn.nba.com/logos/nba/${player.team_id}/global/L/logo.svg`;

        const card = document.createElement("div");
        card.className = "mini-card";
        card.innerHTML = `
            <img src="${headshot}" alt="${player.full_name}">
            <h4>${player.full_name}</h4>
            <p>${player.position}</p>
            <img src="${logo}" alt="${player.team}" style="width:30px; height:auto;">
            <button onclick="fetchPlayerStats('${player.full_name}')">View Stats</button>
        `;

        container.appendChild(card);
    });
}

// Load mini cards on page load
window.onload = loadTodayPlayers;
