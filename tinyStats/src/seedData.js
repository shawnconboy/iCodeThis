const mongoose = require('mongoose');
const Team = require('./models/Team');
const Game = require('./models/Game');
const Favorite = require('./models/Favorite');
require('dotenv').config();

const sampleTeams = [
    {
        name: 'Red Dragons',
        sport: 'Soccer',
        ageGroup: 'U14',
        location: 'New York',
        stats: {
            wins: 8,
            losses: 2,
            ties: 1
        },
        players: [
            { name: 'Mike Johnson', number: 10, position: 'Forward' },
            { name: 'David Smith', number: 5, position: 'Defender' },
            { name: 'James Wilson', number: 1, position: 'Goalkeeper' }
        ]
    },
    {
        name: 'Blue Hawks',
        sport: 'Baseball',
        ageGroup: 'U12',
        location: 'Chicago',
        stats: {
            wins: 6,
            losses: 3,
            ties: 0
        },
        players: [
            { name: 'Tom Brown', number: 7, position: 'Pitcher' },
            { name: 'Sam Davis', number: 3, position: 'Catcher' },
            { name: 'Alex Lee', number: 9, position: 'Outfield' }
        ]
    },
    {
        name: 'Green Tigers',
        sport: 'Basketball',
        ageGroup: 'U16',
        location: 'Los Angeles',
        stats: {
            wins: 9,
            losses: 1,
            ties: 0
        },
        players: [
            { name: 'Chris Anderson', number: 23, position: 'Guard' },
            { name: 'Ryan Miller', number: 45, position: 'Forward' },
            { name: 'Kevin White', number: 12, position: 'Center' }
        ]
    }
];

const sampleGames = [
    {
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        location: "Springfield Community Field",
        status: "scheduled",
        score: { home: 0, away: 0 }
    },
    {
        date: new Date(Date.now() + 48 * 60 * 60 * 1000), // Day after tomorrow
        location: "Springfield Sports Complex",
        status: "scheduled",
        score: { home: 0, away: 0 }
    },
    {
        date: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        location: "Springfield Community Field",
        status: "completed",
        score: { home: 3, away: 2 },
        events: [
            {
                type: "goal",
                description: "Mike Johnson scored in the first half",
                timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000)
            },
            {
                type: "goal",
                description: "David Wilson scored in the second half",
                timestamp: new Date(Date.now() - 24.5 * 60 * 60 * 1000)
            }
        ]
    }
];

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/tinystats', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Clear existing data
        await Team.deleteMany({});
        await Game.deleteMany({});
        await Favorite.deleteMany({});
        console.log('Cleared existing data');

        // Insert sample teams
        const teams = await Team.insertMany(sampleTeams);
        console.log('Inserted sample teams:', teams);

        // Create games with team references
        const games = await Promise.all(sampleGames.map(async (game, index) => {
            const homeTeam = teams[0]; // Red Dragons
            const awayTeam = teams[1]; // Blue Hawks
            return Game.create({
                ...game,
                homeTeam: homeTeam._id,
                awayTeam: awayTeam._id
            });
        }));
        console.log('Inserted games');

        // Create some favorites
        const favorites = await Favorite.create([
            {
                userId: 'test_user_1',
                teamId: teams[0]._id
            },
            {
                userId: 'test_user_1',
                teamId: teams[1]._id
            }
        ]);
        console.log('Inserted favorites');

        console.log('Database seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase(); 