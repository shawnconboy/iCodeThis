// Connect to Socket.IO
const socket = io();

// State
let currentFilter = 'all';
let recentlyViewedTeams = JSON.parse(localStorage.getItem('recentlyViewedTeams') || '[]');
let currentUser = localStorage.getItem('userId') || generateUserId();
let favoriteTeams = [];
let favoritePlayers = [];
let userPreferences = {
    darkMode: localStorage.getItem('darkMode') === 'true'
};

// DOM Elements
let searchInput;
let searchButton;
let searchResults;
let favoritesList;
let recentlyViewedList;
let filterButtons;
let themeToggle;
let popularTeamsGrid;
let liveGamesGrid;

// Initialize DOM Elements
function initializeDOMElements() {
    searchInput = document.querySelector('.search-input');
    searchButton = document.querySelector('.search-button');
    searchResults = document.getElementById('search-results');
    favoritesList = document.getElementById('favorites-list');
    recentlyViewedList = document.getElementById('recently-viewed-list');
    filterButtons = document.querySelectorAll('.filter-button');
    themeToggle = document.getElementById('theme-toggle');
    popularTeamsGrid = document.getElementById('popular-teams');
    liveGamesGrid = document.getElementById('live-games');
}

// Theme Management
function updateThemeIcon(isDarkMode) {
    if (themeToggle) {
        themeToggle.innerHTML = isDarkMode ? 
            '<i class="fas fa-sun"></i>' : 
            '<i class="fas fa-moon"></i>';
    }
}

// Generate a random user ID if not exists
function generateUserId() {
    const userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('userId', userId);
    return userId;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    initializeDOMElements();

    // Set up event listeners
    if (searchButton) {
        searchButton.addEventListener('click', handleSearch);
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
    }

    if (filterButtons) {
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                currentFilter = button.dataset.filter;
                handleSearch();
            });
        });
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            userPreferences.darkMode = !userPreferences.darkMode;
            localStorage.setItem('darkMode', userPreferences.darkMode);
            document.body.classList.toggle('dark-mode', userPreferences.darkMode);
            updateThemeIcon(userPreferences.darkMode);
        });
    }

    // Initialize theme
    document.body.classList.toggle('dark-mode', userPreferences.darkMode);
    updateThemeIcon(userPreferences.darkMode);

    // Initialize tab switching
    const tabs = document.querySelectorAll('.favorite-tab');
    const teamsContainer = document.getElementById('favorites-teams');
    const playersContainer = document.getElementById('favorites-players');

    if (tabs.length && teamsContainer && playersContainer) {
        // Set initial state
        teamsContainer.style.display = 'block';
        playersContainer.style.display = 'none';

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Show/hide appropriate content
                const tabName = tab.dataset.tab;
                teamsContainer.style.display = tabName === 'teams' ? 'block' : 'none';
                playersContainer.style.display = tabName === 'players' ? 'block' : 'none';

                // If switching to players tab, refresh the players list
                if (tabName === 'players') {
                    loadFavoritePlayers();
                }
            });
        });
    }

    // Load initial data
    loadPopularTeams();
    loadFavorites();
    loadLiveGames();
    if (recentlyViewedList) {
        loadFavoritePlayers();
        updateRecentlyViewed();
    }
});

// Search Handler
async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    showLoading();
    try {
        // Search for teams
        const teamsResponse = await fetch(`/api/teams/search/${query}`);
        if (!teamsResponse.ok) throw new Error('Team search failed');
        const teams = await teamsResponse.json();

        // Search for players
        const playersResponse = await fetch(`/api/players/search/${query}`);
        if (!playersResponse.ok) throw new Error('Player search failed');
        const players = await playersResponse.json();

        // Display both teams and players
        await displaySearchResults(teams, players);
    } catch (error) {
        console.error('Search error:', error);
        searchResults.innerHTML = '<p class="error">Failed to search. Please try again.</p>';
    } finally {
        hideLoading();
    }
}

// Create Team Card
function createTeamCard(team, isFavorite = false) {
    const sportEmoji = team.sport === 'Soccer' ? '⚽' : '⚾';
    return `
        <div class="team-card" data-team-id="${team._id}">
            <div class="team-header">
                <h3><a href="/team.html?id=${team._id}" class="team-link"><span class="team-sport-icon">${sportEmoji}</span> ${team.name}</a></h3>
                <div class="team-actions">
                    <button class="favorite-button ${isFavorite ? 'active' : ''}" onclick="toggleFavorite('${team._id}', event)">
                        <i class="fas fa-star"></i>
                    </button>
                    <button class="share-button" onclick="shareTeam('${team._id}')">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
            </div>
            <p>${team.ageGroup} • ${team.location}</p>
            <div class="team-stats">
                <span><span class="team-stats-icon">🏆</span> ${team.stats.wins}W</span>
                <span><span class="team-stats-icon">❌</span> ${team.stats.losses}L</span>
                <span><span class="team-stats-icon">🤝</span> ${team.stats.ties}T</span>
            </div>
        </div>
    `;
}

// Toggle Favorite
async function toggleFavorite(teamId, event) {
    // Prevent the click from bubbling up to the team card
    if (event) {
        event.stopPropagation();
    }

    try {
        // Check if team is already a favorite
        const response = await fetch(`/api/favorites/${currentUser}`);
        if (!response.ok) throw new Error('Failed to fetch favorites');
        const favorites = await response.json();
        const isFavorite = favorites.some(fav => fav.teamId === teamId);

        // Toggle the favorite status
        const method = isFavorite ? 'DELETE' : 'POST';
        const url = isFavorite ? `/api/favorites/${teamId}?userId=${currentUser}` : '/api/favorites';
        const body = isFavorite ? null : JSON.stringify({ userId: currentUser, teamId: teamId });

        const toggleResponse = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            body
        });

        if (!toggleResponse.ok) throw new Error('Failed to toggle favorite');
        
        // Refresh favorites display and update the star icon
        loadFavorites();
        updateStarIcon(teamId, !isFavorite);
    } catch (error) {
        console.error('Error toggling favorite:', error);
    }
}

// Update star icon for a specific team card
function updateStarIcon(teamId, isFavorite) {
    const teamCard = document.querySelector(`.team-card[data-team-id="${teamId}"]`);
    if (teamCard) {
        const favoriteButton = teamCard.querySelector('.favorite-button');
        if (favoriteButton) {
            favoriteButton.classList.toggle('active', isFavorite);
            favoriteButton.querySelector('i').className = `fas ${isFavorite ? 'fa-star' : 'fa-star'}`;
        }
    }
}

// Display Search Results
async function displaySearchResults(teams, players) {
    const filteredTeams = teams.filter(team => 
        currentFilter === 'all' || team.sport.toLowerCase() === currentFilter
    );

    if (filteredTeams.length === 0 && players.length === 0) {
        searchResults.innerHTML = '<p>No teams or players found matching your search.</p>';
        return;
    }

    let resultsHTML = '';

    try {
        // Fetch favorites for both teams and players
        const [teamFavorites, playerFavorites] = await Promise.all([
            fetch(`/api/favorites/${currentUser}`).then(res => res.json()),
            fetch(`/api/favorites/players/${currentUser}`).then(res => res.json())
        ]);

        // Display teams first
        if (filteredTeams.length > 0) {
            resultsHTML += '<div class="search-section"><h3>Teams</h3>';
            resultsHTML += filteredTeams.map(team => 
                createTeamCard(team, teamFavorites.some(fav => fav.teamId === team._id))
            ).join('');
            resultsHTML += '</div>';
        }

        // Display players second
        if (players.length > 0) {
            resultsHTML += '<div class="search-section"><h3>Players</h3>';
            resultsHTML += players.map(player => `
                <div class="player-card">
                    <div class="player-info">
                        <span class="player-name">${player.name}</span>
                        <span class="player-details">#${player.number} • ${player.position}</span>
                        <span class="player-team">${player.teamName}</span>
                    </div>
                    <button class="favorite-button ${playerFavorites.some(fav => fav.playerId === player._id) ? 'active' : ''}" 
                            onclick="toggleFavoritePlayer('${player._id}', '${player.teamId}', event)">
                        <i class="fas fa-star"></i>
                    </button>
                </div>
            `).join('');
            resultsHTML += '</div>';
        }

        // Update the search results with all content
        updateSearchResults(resultsHTML);
    } catch (error) {
        console.error('Error displaying search results:', error);
        searchResults.innerHTML = '<p>Error displaying search results. Please try again.</p>';
    }
}

// Update search results
function updateSearchResults(html) {
    const searchResults = document.getElementById('search-results');
    if (searchResults) {
        searchResults.innerHTML = html;
    }
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
    if (!team || !team._id) {
        console.warn('Invalid team data:', team);
        return;
    }
    recentlyViewedTeams = [team, ...recentlyViewedTeams.filter(t => t._id !== team._id)].slice(0, 5);
    localStorage.setItem('recentlyViewedTeams', JSON.stringify(recentlyViewedTeams));
    updateRecentlyViewed();
}

function updateRecentlyViewed() {
    if (!recentlyViewedList) {
        console.warn('Recently viewed list element not found');
        return;
    }

    if (!recentlyViewedTeams || recentlyViewedTeams.length === 0) {
        recentlyViewedList.innerHTML = '<p>No recently viewed teams</p>';
        return;
    }

    // Filter out any invalid teams
    const validTeams = recentlyViewedTeams.filter(team => team && team._id);
    
    if (validTeams.length === 0) {
        recentlyViewedList.innerHTML = '<p>No recently viewed teams</p>';
        // Clear invalid data from localStorage
        localStorage.setItem('recentlyViewedTeams', '[]');
        recentlyViewedTeams = [];
        return;
    }

    recentlyViewedList.innerHTML = validTeams.map(team => createTeamCard(team)).join('');
}

// Event Delegation for Team Cards
document.addEventListener('click', (e) => {
    // First check if we clicked on a favorite button
    const favoriteButton = e.target.closest('.favorite-button');
    if (favoriteButton) {
        return; // Let the button's own click handler handle it
    }

    // Then check if we clicked on a team card
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
            window.location.href = `/team.html?id=${teamId}`;
        } catch (error) {
            console.error('Error handling team card click:', error);
            // If there's an error, try to navigate with just the ID
            window.location.href = `/team.html?id=${teamId}`;
        }
    }
});

// Favorites
async function loadFavorites() {
    try {
        const response = await fetch(`/api/favorites/${currentUser}`);
        if (!response.ok) throw new Error('Failed to fetch favorites');
        const favorites = await response.json();
        displayFavorites(favorites);
    } catch (error) {
        console.error('Error loading favorites:', error);
        favoritesList.innerHTML = '<p style="color: #6b7280; text-align: center;">Error loading favorites</p>';
    }
}

async function displayFavorites(favorites) {
    const favoritesTeamsList = document.getElementById('favorites-teams');
    const favoritesPlayersList = document.getElementById('favorites-players');
    
    if (!favoritesTeamsList || !favoritesPlayersList) return;

    // Separate teams and players
    const teams = favorites.filter(fav => !fav.playerId);
    const players = favorites.filter(fav => fav.playerId);

    // Display favorite teams
    if (teams.length > 0) {
        // Fetch full team data for each favorite team
        const teamPromises = teams.map(async (fav) => {
            const response = await fetch(`/api/teams/${fav.teamId}`);
            if (!response.ok) throw new Error('Failed to fetch team data');
            const team = await response.json();
            return team;
        });

        try {
            const teamData = await Promise.all(teamPromises);
            favoritesTeamsList.innerHTML = teamData.map(team => `
                <div class="favorite-team" data-team-id="${team._id}">
                    <div class="team-header">
                        <h3><a href="/team.html?id=${team._id}" class="team-link"><span class="team-sport-icon">${team.sport === 'Soccer' ? '⚽' : '⚾'}</span> ${team.name}</a></h3>
                        <div class="team-actions">
                            <button class="favorite-button active" onclick="toggleFavorite('${team._id}', event)">
                                <i class="fas fa-star"></i>
                            </button>
                        </div>
                    </div>
                    <p>${team.ageGroup} • ${team.location}</p>
                    <div class="team-stats">
                        <span><span class="team-stats-icon">🏆</span> ${team.stats?.wins || 0}W</span>
                        <span><span class="team-stats-icon">❌</span> ${team.stats?.losses || 0}L</span>
                        <span><span class="team-stats-icon">🤝</span> ${team.stats?.ties || 0}T</span>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error fetching team data:', error);
            favoritesTeamsList.innerHTML = '<p>Error loading favorite teams</p>';
        }
    } else {
        favoritesTeamsList.innerHTML = '<p>No favorite teams yet</p>';
    }

    // Display favorite players
    if (players.length > 0) {
        favoritesPlayersList.innerHTML = players.map(player => `
            <div class="player-card">
                <div class="player-info">
                    <span class="player-name">${player.player.name}</span>
                    <span class="player-details">#${player.player.number} • ${player.player.position}</span>
                </div>
                <button onclick="toggleFavoritePlayer('${player.playerId}', '${player.teamId}', event)" class="remove-favorite">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    } else {
        favoritesPlayersList.innerHTML = '<p>No favorite players yet</p>';
    }
}

async function removeFavorite(teamId) {
    try {
        const response = await fetch(`/api/favorites/${teamId}?userId=${currentUser}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Failed to remove favorite');
        
        // Refresh favorites display
        loadFavorites();
    } catch (error) {
        console.error('Error removing favorite:', error);
        alert('Failed to remove favorite. Please try again.');
    }
}

// Load popular teams
async function loadPopularTeams() {
    try {
        const response = await fetch('/api/teams');
        if (!response.ok) throw new Error('Failed to fetch teams');
        const teams = await response.json();

        // Fetch favorites
        const favoritesResponse = await fetch(`/api/favorites/${currentUser}`);
        const favorites = await favoritesResponse.json();

        if (popularTeamsGrid) {
            popularTeamsGrid.innerHTML = teams.map(team => {
                const sportEmoji = team.sport === 'Soccer' ? '⚽' : '⚾';
                const isFavorite = favorites.some(fav => fav.teamId === team._id);
                return `
                    <div class="team-card" data-team-id="${team._id}">
                        <div class="team-header">
                            <h3><a href="/team.html?id=${team._id}" class="team-link"><span class="team-sport-icon">${sportEmoji}</span> ${team.name}</a></h3>
                            <div class="team-actions">
                                <button class="favorite-button ${isFavorite ? 'active' : ''}" onclick="toggleFavorite('${team._id}', event)">
                                    <i class="fas fa-star"></i>
                                </button>
                                <button class="share-button" onclick="shareTeam('${team._id}')">
                                    <i class="fas fa-share-alt"></i>
                                </button>
                            </div>
                        </div>
                        <p>${team.ageGroup} • ${team.location}</p>
                        <div class="team-stats">
                            <span><span class="team-stats-icon">🏆</span> ${team.stats?.wins || 0}W</span>
                            <span><span class="team-stats-icon">❌</span> ${team.stats?.losses || 0}L</span>
                            <span><span class="team-stats-icon">🤝</span> ${team.stats?.ties || 0}T</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Error loading teams:', error);
        if (popularTeamsGrid) {
            popularTeamsGrid.innerHTML = '<p style="color: #6b7280; text-align: center;">Error loading teams</p>';
        }
    }
}

// Display popular teams
function displayPopularTeams(teams) {
    const popularTeamsGrid = document.getElementById('popular-teams');
    if (!popularTeamsGrid) return;

    if (teams.length === 0) {
        popularTeamsGrid.innerHTML = '<p>No teams found</p>';
        return;
    }

    // Fetch favorite teams for the current user
    fetchFavorites().then(favorites => {
        const favoriteTeamIds = new Set(favorites.teams.map(team => team._id));
        
        popularTeamsGrid.innerHTML = teams.map(team => 
            createTeamCard(team, favoriteTeamIds.has(team._id))
        ).join('');
    }).catch(error => {
        console.error('Error fetching favorites:', error);
        popularTeamsGrid.innerHTML = teams.map(team => createTeamCard(team)).join('');
    });
}

// Live Games
async function loadLiveGames() {
    try {
        // For now, using sample data
        const sampleLiveGames = [
            {
                homeTeam: {
                    name: 'Red Dragons',
                    _id: '67dee661d38a06b37e23168f',
                    sport: 'Soccer'
                },
                awayTeam: {
                    name: 'Blue Hawks',
                    _id: '67dee661d38a06b37e231696',
                    sport: 'Soccer'
                },
                homeScore: 7,
                awayScore: 2,
                status: 'Live',
                time: '65:00'
            },
            {
                homeTeam: {
                    name: 'Red Dragons',
                    _id: '67dee661d38a06b37e23168f',
                    sport: 'Soccer'
                },
                awayTeam: {
                    name: 'Blue Hawks',
                    _id: '67dee661d38a06b37e231696',
                    sport: 'Soccer'
                },
                homeScore: 2,
                awayScore: 1,
                status: 'Live',
                time: '15:00'
            },
            {
                homeTeam: {
                    name: 'Green Tigers',
                    _id: '67dee661d38a06b37e23169d',
                    sport: 'Baseball'
                },
                awayTeam: {
                    name: 'Red Dragons',
                    _id: '67dee661d38a06b37e23168f',
                    sport: 'Baseball'
                },
                homeScore: 5,
                awayScore: 3,
                status: 'Live',
                time: '6th Inning'
            },
            {
                homeTeam: {
                    name: 'Blue Hawks',
                    _id: '67dee661d38a06b37e231696',
                    sport: 'Soccer'
                },
                awayTeam: {
                    name: 'Green Tigers',
                    _id: '67dee661d38a06b37e23169d',
                    sport: 'Soccer'
                },
                homeScore: 4,
                awayScore: 0,
                status: 'Live',
                time: '30:00'
            }
        ];
        displayLiveGames(sampleLiveGames);
    } catch (error) {
        console.error('Error loading live games:', error);
    }
}

// Display live games
function displayLiveGames(games) {
    const liveGamesContainer = document.getElementById('live-games');
    if (!liveGamesContainer) {
        console.error('Live games container not found');
        return;
    }

    if (!games || games.length === 0) {
        liveGamesContainer.innerHTML = '<p style="color: #6b7280; text-align: center;">No live games at the moment</p>';
        return;
    }

    liveGamesContainer.innerHTML = games.map(game => `
        <div class="live-game-card">
            <div class="game-teams">
                <div class="game-team">
                    <span class="team-sport-icon">${game.homeTeam.sport === 'Soccer' ? '⚽' : '⚾'}</span>
                    <a href="/team.html?id=${game.homeTeam._id}" class="team-link">${game.homeTeam.name}</a>
                    <span class="team-score">${game.homeScore}</span>
                </div>
                <span class="vs">vs</span>
                <div class="game-team">
                    <span class="team-sport-icon">${game.homeTeam.sport === 'Soccer' ? '⚽' : '⚾'}</span>
                    <a href="/team.html?id=${game.awayTeam._id}" class="team-link">${game.awayTeam.name}</a>
                    <span class="team-score">${game.awayScore}</span>
                </div>
            </div>
            <div class="game-status">
                ${game.isLive ? '<span class="live-badge">LIVE</span>' : ''}
                <span class="game-time">${game.time}</span>
            </div>
        </div>
    `).join('');
}

// Toggle Favorite Player
async function toggleFavoritePlayer(playerId, teamId, event) {
    event.preventDefault();
    event.stopPropagation();
    
    const button = event.currentTarget;
    const isFavorite = button.classList.contains('active');
    
    try {
        const response = await fetch(`/api/favorites/players/${isFavorite ? playerId : ''}?userId=${currentUser}`, {
            method: isFavorite ? 'DELETE' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: isFavorite ? undefined : JSON.stringify({
                userId: currentUser,
                teamId: teamId,
                playerId: playerId
            })
        });

        if (!response.ok) throw new Error('Failed to toggle favorite');

        button.classList.toggle('active');
        button.querySelector('i').className = `fas ${isFavorite ? 'fa-star' : 'fa-star'}`;
        
        // Refresh favorites display
        loadFavoritePlayers();
    } catch (error) {
        console.error('Error toggling favorite:', error);
        alert('Failed to update favorites. Please try again.');
    }
}

// Load favorite players
async function loadFavoritePlayers() {
    try {
        const response = await fetch(`/api/favorites/players/${currentUser}`);
        if (!response.ok) throw new Error('Failed to fetch favorite players');
        const favorites = await response.json();
        
        const playersContainer = document.getElementById('favorites-players');
        if (!playersContainer) {
            console.error('Favorites players container not found');
            return;
        }

        if (!favorites || favorites.length === 0) {
            playersContainer.innerHTML = 
                '<p style="color: #6b7280; text-align: center;">No favorite players yet</p>';
            return;
        }

        displayFavoritePlayers(favorites);
    } catch (error) {
        console.error('Error loading favorite players:', error);
        const playersContainer = document.getElementById('favorites-players');
        if (playersContainer) {
            playersContainer.innerHTML = 
                '<p style="color: #6b7280; text-align: center;">Error loading favorite players</p>';
        }
    }
}

// Display favorite players
async function displayFavoritePlayers(favorites) {
    const playersContainer = document.getElementById('favorites-players');
    if (!playersContainer) {
        console.error('Favorites players container not found');
        return;
    }

    if (!favorites || favorites.length === 0) {
        playersContainer.innerHTML = '<p>No favorite players yet</p>';
        return;
    }

    try {
        // Fetch team data for each favorite to get player details
        const processedFavorites = await Promise.all(favorites.map(async (favorite) => {
            try {
                const response = await fetch(`/api/teams/${favorite.teamId}`);
                if (!response.ok) throw new Error('Failed to fetch team data');
                const team = await response.json();
                const player = team.players.find(p => `${team._id}-${p.number}` === favorite.playerId);
                return {
                    ...favorite,
                    player: player || { name: 'Unknown Player', number: '?', position: 'Unknown' },
                    teamName: team.name
                };
            } catch (error) {
                console.error('Error fetching team data:', error);
                return {
                    ...favorite,
                    player: { name: 'Unknown Player', number: '?', position: 'Unknown' },
                    teamName: 'Unknown Team'
                };
            }
        }));

        playersContainer.innerHTML = processedFavorites.map(favorite => `
            <div class="player-card">
                <div class="player-info">
                    <span class="player-name">${favorite.player.name}</span>
                    <span class="player-details">#${favorite.player.number} • ${favorite.player.position}</span>
                    <span class="player-team">${favorite.teamName}</span>
                </div>
                <button class="favorite-button active" onclick="toggleFavoritePlayer('${favorite.playerId}', '${favorite.teamId}', event)">
                    <i class="fas fa-star"></i>
                </button>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error processing favorites:', error);
        playersContainer.innerHTML = '<p>Error loading favorite players</p>';
    }
} 