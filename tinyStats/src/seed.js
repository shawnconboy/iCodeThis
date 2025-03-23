const mongoose = require('mongoose');
const Team = require('./models/Team');
const Game = require('./models/Game');
const Favorite = require('./models/Favorite');
const PlayerFavorite = require('./models/PlayerFavorite');

const teams = [
    {
        name: "Red Dragons",
        sport: "soccer",
        ageGroup: "U14",
        location: "New York",
        players: [
            { name: "Mike Johnson", number: "10", position: "Forward" },
            { name: "David Smith", number: "5", position: "Defender" },
            { name: "James Wilson", number: "1", position: "Goalkeeper" }
        ],
        stats: {
            wins: 8,
            losses: 2,
            ties: 1
        }
    },
    {
        name: "Blue Hawks",
        sport: "baseball",
        ageGroup: "U12",
        location: "Chicago",
        players: [
            { name: "Tommy Brown", number: "7", position: "Pitcher" },
            { name: "Billy Davis", number: "3", position: "Catcher" },
            { name: "Johnny Wilson", number: "12", position: "Outfield" }
        ],
        stats: {
            wins: 6,
            losses: 3,
            ties: 0
        }
    },
    {
        name: "Green Tigers",
        sport: "baseball",
        ageGroup: "U16",
        location: "Los Angeles",
        players: [
            { name: "Alex Rodriguez", number: "4", position: "Shortstop" },
            { name: "Chris Martinez", number: "9", position: "Center Field" },
            { name: "Ryan Thompson", number: "15", position: "Pitcher" }
        ],
        stats: {
            wins: 9,
            losses: 1,
            ties: 0
        }
    },
    {
        name: "Duncan United",
        sport: "soccer",
        ageGroup: "U16",
        location: "Duncan, South Carolina",
        players: [
            { name: "Jean Telemaque", number: "11", position: "Forward" },
            { name: "Marcus Wright", number: "6", position: "Midfielder" },
            { name: "Carlos Ruiz", number: "2", position: "Defender" },
            { name: "Kevin Chen", number: "1", position: "Goalkeeper" },
            { name: "Diego Santos", number: "8", position: "Midfielder" },
            { name: "Tyler Johnson", number: "4", position: "Defender" },
            { name: "Liam O'Connor", number: "7", position: "Forward" },
            { name: "Andre Williams", number: "13", position: "Midfielder" },
            { name: "Hassan Ali", number: "5", position: "Defender" },
            { name: "Lucas Martinez", number: "10", position: "Forward" },
            { name: "Samuel Park", number: "16", position: "Midfielder" }
        ],
        stats: {
            wins: 12,
            losses: 1,
            ties: 2,
            goalsScored: 45,
            goalsAgainst: 12,
            cleanSheets: 8,
            topScorer: "Jean Telemaque",
            topScorerGoals: 18,
            assistLeader: "Diego Santos",
            assistLeaderAssists: 14,
            leaguePosition: 1,
            lastFiveGames: ["W", "W", "D", "W", "W"]
        }
    },
    {
        name: "Charleston City FC",
        sport: "soccer",
        ageGroup: "U16",
        location: "Charleston, South Carolina",
        players: [
            { name: "Michael Foster", number: "9", position: "Forward" },
            { name: "James Lee", number: "1", position: "Goalkeeper" },
            { name: "Robert Taylor", number: "4", position: "Defender" }
        ],
        stats: {
            wins: 8,
            losses: 4,
            ties: 3
        }
    },
    {
        name: "Greenville United",
        sport: "soccer",
        ageGroup: "U16",
        location: "Greenville, South Carolina",
        players: [
            { name: "Thomas Anderson", number: "10", position: "Forward" },
            { name: "William Clark", number: "5", position: "Midfielder" },
            { name: "David Moore", number: "2", position: "Defender" }
        ],
        stats: {
            wins: 7,
            losses: 5,
            ties: 3
        }
    }
];

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/tinystats');
        console.log('Connected to MongoDB');

        // Clear existing data
        await Team.deleteMany({});
        await Game.deleteMany({});
        await Favorite.deleteMany({});
        await PlayerFavorite.deleteMany({});
        console.log('Cleared existing data');

        // Insert teams
        const insertedTeams = await Team.insertMany(teams);
        console.log('Inserted teams:', insertedTeams.length);

        // Get team IDs for easy reference
        const duncanUnited = insertedTeams[3]._id;
        const charlestonCity = insertedTeams[4]._id;
        const greenvilleUnited = insertedTeams[5]._id;

        // Create games using team ObjectIds
        const games = [
            // Past games (showing Duncan United's strong record)
            {
                homeTeam: duncanUnited,
                awayTeam: charlestonCity,
                date: new Date("2025-03-01"),
                time: "14:00",
                location: "Duncan Soccer Complex",
                status: "completed",
                score: {
                    home: 4,
                    away: 1
                },
                scorers: ["Jean Telemaque (2)", "Diego Santos", "Liam O'Connor"],
                highlights: "Jean Telemaque's spectacular double leads Duncan United to victory"
            },
            {
                homeTeam: greenvilleUnited,
                awayTeam: duncanUnited,
                date: new Date("2025-03-08"),
                time: "15:30",
                location: "Greenville Sports Park",
                status: "completed",
                score: {
                    home: 1,
                    away: 3
                },
                scorers: ["Jean Telemaque (2)", "Lucas Martinez"],
                highlights: "Another masterclass from Telemaque secures away win"
            },
            // Upcoming games
            {
                homeTeam: duncanUnited,
                awayTeam: greenvilleUnited,
                date: new Date("2025-03-29"),
                time: "16:00",
                location: "Duncan Soccer Complex",
                status: "scheduled",
                ticketInfo: "Adults: $10, Children: $5",
                broadcastInfo: "Live on Local Sports Network"
            },
            {
                homeTeam: charlestonCity,
                awayTeam: duncanUnited,
                date: new Date("2025-04-05"),
                time: "19:00",
                location: "Charleston Memorial Stadium",
                status: "scheduled",
                ticketInfo: "Adults: $12, Children: $6",
                broadcastInfo: "Live on SC Sports Channel"
            },
            {
                homeTeam: duncanUnited,
                awayTeam: charlestonCity,
                date: new Date("2025-04-12"),
                time: "14:00",
                location: "Duncan Soccer Complex",
                status: "scheduled",
                ticketInfo: "Adults: $10, Children: $5",
                broadcastInfo: "Live on Local Sports Network"
            }
        ];

        // Insert games
        const insertedGames = await Game.insertMany(games);
        console.log('Inserted games:', insertedGames.length);

        // Create favorites using team ObjectIds
        const favorites = [
            {
                userId: "user_rxsz0eje1",
                teamId: insertedTeams[0]._id // Red Dragons
            },
            {
                userId: "user_rxsz0eje1",
                teamId: insertedTeams[1]._id // Blue Hawks
            },
            {
                userId: "user_rxsz0eje1",
                teamId: duncanUnited // Duncan United
            }
        ];

        // Insert favorites
        const insertedFavorites = await Favorite.insertMany(favorites);
        console.log('Inserted favorites:', insertedFavorites.length);

        // Create player favorites using team ObjectIds
        const playerFavorites = [
            {
                userId: "user_rxsz0eje1",
                teamId: insertedTeams[0]._id,
                playerId: `${insertedTeams[0]._id}-10` // Mike Johnson
            },
            {
                userId: "user_rxsz0eje1",
                teamId: duncanUnited,
                playerId: `${duncanUnited}-11` // Jean Telemaque
            }
        ];

        // Insert player favorites
        const insertedPlayerFavorites = await PlayerFavorite.insertMany(playerFavorites);
        console.log('Inserted player favorites:', insertedPlayerFavorites.length);

        console.log('Database seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase(); 