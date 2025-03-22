// Connect to Socket.IO
const socket = io();

// DOM Elements
const searchInput = document.querySelector('.search-input');
const searchButton = document.querySelector('.search-button');
const searchResults = document.getElementById('search-results');
const favoritesList = document.getElementById('favorites-list');
const recentlyViewedList = document.getElementById('recently-viewed-list');
const filterButtons = document.querySelectorAll('.filter-button');
const themeToggle = document.getElementById('theme-toggle');
const popularTeamsGrid = document.getElementById('popular-teams');
const liveGamesGrid = document.getElementById('live-games');

// State
let currentFilter = 'all';
let recentlyViewedTeams = JSON.parse(localStorage.getItem('recentlyViewedTeams') || '[]');
let currentUser = localStorage.getItem('userId') || generateUserId();
let favoriteTeams = [];
let userPreferences = {
    darkMode: localStorage.getItem('darkMode') === 'true'
};

// Theme Management
if (userPreferences.darkMode) {
    document.body.classList.add('dark-mode');
    updateThemeIcon(true);
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    userPreferences.darkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', userPreferences.darkMode);
    updateThemeIcon(userPreferences.darkMode);
});

function updateThemeIcon(isDarkMode) {
    themeToggle.innerHTML = isDarkMode ? 
        '<i class="fas fa-sun"></i>' : 
        '<i class="fas fa-moon"></i>';
}

// Generate a random user ID if not exists
function generateUserId() {
    const userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', userId);
    return userId;
}

// Event Listeners
searchButton.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSearch();
});

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentFilter = button.dataset.filter;
        handleSearch();
    });
});

// Search Handler
async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    showLoading();
    try {
        const response = await fetch(`/api/teams/search/${query}`);
        if (!response.ok) throw new Error('Search failed');
        const teams = await response.json();
        displaySearchResults(teams);
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = '<p class="error">Failed to search teams. Please try again.</p>';
    } finally {
        hideLoading();
    }
}

// Display Search Results
function displaySearchResults(teams) {
    const filteredTeams = teams.filter(team => 
        currentFilter === 'all' || team.sport.toLowerCase() === currentFilter
    );

    if (filteredTeams.length === 0) {
        searchResults.innerHTML = '<p>No teams found matching your search.</p>';
        return;
    }

    searchResults.innerHTML = filteredTeams.map(team => createTeamCard(team)).join('');
}

// Create Team Card
function createTeamCard(team) {
    const sportIcon = getSportIcon(team.sport);
    return `
        <div class="team-card" data-team-id="${team._id}">
            <div class="team-header">
                <img src="${sportIcon}" alt="${team.sport}" class="team-sport-icon">
                <h3>${team.name}</h3>
                <button class="share-button" onclick="shareTeam('${team._id}')">
                    <i class="fas fa-share-alt"></i>
                </button>
            </div>
            <p>${team.sport} • ${team.ageGroup}</p>
            <p>${team.location}</p>
            <div class="team-stats">
                <span>🏆 ${team.stats.wins} Wins</span>
                <span>💪 ${team.stats.losses} Losses</span>
                <span>🤝 ${team.stats.ties} Ties</span>
            </div>
        </div>
    `;
}

// Get Sport Icon
function getSportIcon(sport) {
    const icons = {
        baseball: '/images/baseball.svg',
        soccer: '/images/soccer.svg',
        basketball: '/images/basketball.svg'
    };
    return icons[sport.toLowerCase()] || '/images/default-sport.svg';
}

// Share Team
async function shareTeam(teamId) {
    try {
        const shareUrl = `${window.location.origin}/team?id=${teamId}`;
        if (navigator.share) {
            await navigator.share({
                title: 'Check out this team on TinyStats!',
                url: shareUrl
            });
        } else {
            await navigator.clipboard.writeText(shareUrl);
            alert('Team link copied to clipboard!');
        }
    } catch (error) {
        console.error('Share failed:', error);
    }
}

// Loading States
function showLoading() {
    searchResults.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
        </div>
    `;
}

function hideLoading() {
    // Loading state is cleared when results are displayed
}

// Recently Viewed Teams
function addToRecentlyViewed(team) {
    recentlyViewedTeams = [team, ...recentlyViewedTeams.filter(t => t._id !== team._id)].slice(0, 5);
    localStorage.setItem('recentlyViewedTeams', JSON.stringify(recentlyViewedTeams));
    updateRecentlyViewed();
}

function updateRecentlyViewed() {
    if (recentlyViewedTeams.length === 0) {
        recentlyViewedList.innerHTML = '<p>No recently viewed teams</p>';
        return;
    }
    recentlyViewedList.innerHTML = recentlyViewedTeams.map(team => createTeamCard(team)).join('');
}

// Event Delegation for Team Cards
document.addEventListener('click', (e) => {
    const teamCard = e.target.closest('.team-card');
    if (teamCard) {
        const teamId = teamCard.dataset.teamId;
        if (!teamId) {
            console.error('No team ID found on card');
            return;
        }

        try {
            // Get team data from the card
            const teamData = {
                _id: teamId,
                name: teamCard.querySelector('h3').textContent,
                sport: teamCard.querySelector('p').textContent.split('•')[0].trim(),
                ageGroup: teamCard.querySelector('p').textContent.split('•')[1].trim(),
                location: teamCard.querySelectorAll('p')[1].textContent,
                stats: {
                    wins: parseInt(teamCard.querySelector('.team-stats span:nth-child(1)').textContent.split(' ')[1]) || 0,
                    losses: parseInt(teamCard.querySelector('.team-stats span:nth-child(2)').textContent.split(' ')[1]) || 0,
                    ties: parseInt(teamCard.querySelector('.team-stats span:nth-child(3)').textContent.split(' ')[1]) || 0
                }
            };

            // Store team data in localStorage
            localStorage.setItem(`team_${teamId}`, JSON.stringify(teamData));
            
            // Add to recently viewed
            addToRecentlyViewed(teamData);

            // Navigate to team page
            window.location.href = `/team?id=${teamId}`;
        } catch (error) {
            console.error('Error handling team card click:', error);
            // If there's an error, try to navigate with just the ID
            window.location.href = `/team?id=${teamId}`;
        }
    }
});

// Favorites
function loadFavorites() {
    const localFavorites = JSON.parse(localStorage.getItem('favorites')) || [];
    displayFavorites(localFavorites);

    // Then fetch from API
    fetch('/api/favorites')
        .then(response => response.json())
        .then(favorites => {
            if (favorites.length === 0 && localFavorites.length === 0) {
                // If no favorites in both localStorage and API, show default favorites
                const defaultFavorites = [
                    { id: '1', name: 'Little Giants', sport: 'Baseball', ageGroup: 'U12' },
                    { id: '2', name: 'Thunder Hawks', sport: 'Soccer', ageGroup: 'U14' },
                    { id: '3', name: 'Rising Stars', sport: 'Basketball', ageGroup: 'U10' }
                ];
                localStorage.setItem('favorites', JSON.stringify(defaultFavorites));
                displayFavorites(defaultFavorites);
            } else {
                localStorage.setItem('favorites', JSON.stringify(favorites));
                displayFavorites(favorites);
            }
        })
        .catch(error => {
            console.error('Error loading favorites:', error);
            // If there's an error, keep showing local favorites
        });
}

function displayFavorites(favorites) {
    if (!favorites || favorites.length === 0) {
        favoritesList.innerHTML = '<p style="color: #6b7280; text-align: center;">No favorite teams yet</p>';
        return;
    }

    favoritesList.innerHTML = favorites.map(team => `
        <div class="favorite-team" data-team-id="${team.id}">
            <div>
                <div class="team-name">${team.name}</div>
                <div class="team-info">${team.sport} • ${team.ageGroup}</div>
            </div>
            <button class="remove-favorite" data-team-id="${team.id}">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');

    // Add click handlers
    document.querySelectorAll('.favorite-team').forEach(team => {
        team.addEventListener('click', (e) => {
            if (!e.target.closest('.remove-favorite')) {
                window.location.href = `/team/${team.dataset.teamId}`;
            }
        });
    });

    // Add remove handlers
    document.querySelectorAll('.remove-favorite').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(button.dataset.teamId);
        });
    });
}

// Toggle favorite
function toggleFavorite(teamId) {
    fetch('/api/favorites', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ teamId })
    })
    .then(response => response.json())
    .then(favorites => {
        localStorage.setItem('favorites', JSON.stringify(favorites));
        displayFavorites(favorites);
    })
    .catch(error => {
        console.error('Error toggling favorite:', error);
    });
}

// Load popular teams
function loadPopularTeams() {
    fetch('/api/teams')
        .then(response => response.json())
        .then(teams => {
            displayPopularTeams(teams);
        })
        .catch(error => {
            console.error('Error loading teams:', error);
        });
}

// Display popular teams
function displayPopularTeams(teams) {
    if (!teams || teams.length === 0) {
        popularTeamsGrid.innerHTML = '<p style="color: #6b7280; text-align: center;">No teams available</p>';
        return;
    }

    popularTeamsGrid.innerHTML = teams.map(team => `
        <div class="team-card" data-team-id="${team._id}">
            <div class="team-header">
                <img src="/images/${team.sport.toLowerCase()}.svg" alt="${team.sport}" class="team-sport-icon">
                <h3>${team.name}</h3>
                <button class="share-button" onclick="shareTeam('${team._id}')">
                    <i class="fas fa-share-alt"></i>
                </button>
            </div>
            <p>${team.sport} • ${team.ageGroup}</p>
            <p>${team.location}</p>
            <div class="team-stats">
                <span>🏆 ${team.stats.wins || 0} Wins</span>
                <span>💪 ${team.stats.losses || 0} Losses</span>
                <span>🤝 ${team.stats.ties || 0} Ties</span>
            </div>
        </div>
    `).join('');

    // Add click handlers
    document.querySelectorAll('.team-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.share-button')) {
                const teamId = card.dataset.teamId;
                const teamData = {
                    _id: teamId,
                    name: card.querySelector('h3').textContent,
                    sport: card.querySelector('p').textContent.split('•')[0].trim(),
                    ageGroup: card.querySelector('p').textContent.split('•')[1].trim(),
                    location: card.querySelectorAll('p')[1].textContent,
                    stats: {
                        wins: parseInt(card.querySelector('.team-stats span:nth-child(1)').textContent.split(' ')[1]) || 0,
                        losses: parseInt(card.querySelector('.team-stats span:nth-child(2)').textContent.split(' ')[1]) || 0,
                        ties: parseInt(card.querySelector('.team-stats span:nth-child(3)').textContent.split(' ')[1]) || 0
                    }
                };
                localStorage.setItem(`team_${teamId}`, JSON.stringify(teamData));
                addToRecentlyViewed(teamData);
                window.location.href = `/team?id=${teamId}`;
            }
        });
    });
}

// Live Games
function loadLiveGames() {
    // For demo purposes, we'll create some sample live games with more realistic scores
    const sampleLiveGames = [
        {
            id: 'game1',
            homeTeam: { name: 'Little Giants', score: 7 },
            awayTeam: { name: 'Thunder Hawks', score: 2 },
            sport: 'Baseball',
            time: '4th Inning',
            status: 'LIVE'
        },
        {
            id: 'game2',
            homeTeam: { name: 'Rising Stars', score: 68 },
            awayTeam: { name: 'Dragon Warriors', score: 42 },
            sport: 'Basketball',
            time: 'Q4 2:15',
            status: 'LIVE'
        },
        {
            id: 'game3',
            homeTeam: { name: 'Soccer Stars', score: 4 },
            awayTeam: { name: 'Eagle FC', score: 0 },
            sport: 'Soccer',
            time: '78\'',
            status: 'LIVE'
        }
    ];

    displayLiveGames(sampleLiveGames);
}

function displayLiveGames(games) {
    if (!games || games.length === 0) {
        liveGamesGrid.innerHTML = '<p style="color: #6b7280; text-align: center;">No live games at the moment</p>';
        return;
    }

    liveGamesGrid.innerHTML = games.map(game => `
        <div class="live-game-card" data-game-id="${game.id}">
            <div class="game-teams">
                <div class="game-team">
                    <img src="/images/${game.sport.toLowerCase()}.svg" alt="${game.sport}" class="team-sport-icon">
                    <span>${game.homeTeam.name}</span>
                    <span class="team-score">${game.homeTeam.score}</span>
                </div>
                <div class="game-team">
                    <span class="team-score">${game.awayTeam.score}</span>
                    <span>${game.awayTeam.name}</span>
                    <img src="/images/${game.sport.toLowerCase()}.svg" alt="${game.sport}" class="team-sport-icon">
                </div>
            </div>
            <div class="game-info">
                <span>${game.sport}</span>
                <span class="game-status">${game.status}</span>
                <span>${game.time}</span>
            </div>
        </div>
    `).join('');

    // Add click handlers for live game cards
    document.querySelectorAll('.live-game-card').forEach(card => {
        card.addEventListener('click', () => {
            const gameId = card.dataset.gameId;
            // Navigate to game details page or show game details modal
            console.log('Game clicked:', gameId);
        });
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFavorites();
    loadPopularTeams();
    loadLiveGames();
    updateRecentlyViewed();
}); 