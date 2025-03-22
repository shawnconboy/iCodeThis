// Socket.IO connection
const socket = io();

// DOM Elements
const teamName = document.getElementById('team-name');
const teamSport = document.getElementById('team-sport');
const teamAge = document.getElementById('team-age');
const teamLocation = document.getElementById('team-location');
const teamCoach = document.getElementById('team-coach');
const wins = document.getElementById('wins');
const losses = document.getElementById('losses');
const ties = document.getElementById('ties');
const upcomingGames = document.getElementById('upcoming-games');
const playersGrid = document.getElementById('players-grid');

// Get team ID from URL
const urlParams = new URLSearchParams(window.location.search);
const teamId = urlParams.get('id');

// Initialize the page
function initializePage() {
    if (!teamId) {
        console.error('No team ID provided');
        teamName.textContent = 'Error: Team not found';
        return;
    }
    loadTeamData();
}

// Load team data
async function loadTeamData() {
    try {
        // First try to get data from localStorage
        const localTeamData = localStorage.getItem(`team_${teamId}`);
        if (localTeamData) {
            try {
                const team = JSON.parse(localTeamData);
                displayTeamData(team);
            } catch (e) {
                console.error('Error parsing local team data:', e);
            }
        }

        // Then try to get data from API
        const response = await fetch(`/api/teams/${teamId}`);
        if (response.ok) {
            const team = await response.json();
            displayTeamData(team);
            // Update localStorage with fresh data
            localStorage.setItem(`team_${teamId}`, JSON.stringify(team));
        } else if (!localTeamData) {
            throw new Error('Team not found');
        }

        // Load upcoming games
        loadUpcomingGames(teamId);
    } catch (error) {
        console.error('Error loading team data:', error);
        if (!localTeamData) {
            teamName.textContent = 'Error: Team not found';
        }
    }
}

// Display team data
function displayTeamData(team) {
    if (!team) return;

    teamName.textContent = team.name || 'Unknown Team';
    teamSport.textContent = team.sport || 'Not specified';
    teamAge.textContent = team.ageGroup || 'Not specified';
    teamLocation.textContent = team.location || 'Not specified';
    teamCoach.textContent = team.coach?.name || 'Not specified';
    
    // Update stats
    wins.textContent = team.stats?.wins || 0;
    losses.textContent = team.stats?.losses || 0;
    ties.textContent = team.stats?.ties || 0;

    // Display players if available
    if (team.players && team.players.length > 0) {
        displayPlayers(team.players);
    } else {
        playersGrid.innerHTML = '<p>No players listed</p>';
    }
}

// Load upcoming games
async function loadUpcomingGames(teamId) {
    try {
        const response = await fetch(`/api/games/team/${teamId}`);
        if (!response.ok) {
            throw new Error('Failed to load games');
        }
        const games = await response.json();
        displayUpcomingGames(games);
    } catch (error) {
        console.error('Error loading games:', error);
        upcomingGames.innerHTML = '<p>No upcoming games scheduled</p>';
    }
}

// Display upcoming games
function displayUpcomingGames(games) {
    if (!games || games.length === 0) {
        upcomingGames.innerHTML = '<p>No upcoming games scheduled</p>';
        return;
    }

    const gamesList = games.map(game => `
        <div class="game-card">
            <div class="game-info">
                <div class="game-date">${new Date(game.date).toLocaleDateString()}</div>
                <div class="game-teams">${game.homeTeam?.name || 'TBD'} vs ${game.awayTeam?.name || 'TBD'}</div>
                <div class="game-location">${game.location || 'Location TBD'}</div>
            </div>
            ${game.isLive ? '<span class="live-badge">LIVE</span>' : ''}
        </div>
    `).join('');

    upcomingGames.innerHTML = gamesList;
}

// Display players
function displayPlayers(players) {
    if (!players || players.length === 0) {
        playersGrid.innerHTML = '<p>No players listed</p>';
        return;
    }

    const playersList = players.map(player => `
        <div class="player-card">
            <div class="player-name">${player.name || 'Unknown Player'}</div>
            <div class="player-info">
                <span>#${player.number || 'N/A'}</span> • ${player.position || 'N/A'}
            </div>
        </div>
    `).join('');

    playersGrid.innerHTML = playersList;
}

// Socket.IO event handlers
socket.on('gameUpdate', (game) => {
    if (game.homeTeam?._id === teamId || game.awayTeam?._id === teamId) {
        loadUpcomingGames(teamId);
    }
});

socket.on('teamUpdate', (team) => {
    if (team._id === teamId) {
        displayTeamData(team);
    }
});

// Load initial data
document.addEventListener('DOMContentLoaded', initializePage); 