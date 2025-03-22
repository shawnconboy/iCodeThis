const mongoose = require('mongoose');
const Team = require('./models/Team');
const Game = require('./models/Game');
const Favorite = require('./models/Favorite');
require('dotenv').config();

const sampleTeams = [
    {
        name: "Red Dragons",
        sport: "Soccer",
        ageGroup: "U12",
        location: "Springfield",
        coach: {
            name: "John Smith",
            contact: "john.smith@email.com"
        },
        players: [
            { name: "Mike Johnson", number: "1", position: "Goalkeeper" },
            { name: "David Wilson", number: "2", position: "Defender" },
            { name: "James Brown", number: "3", position: "Defender" },
            { name: "Robert Davis", number: "4", position: "Midfielder" },
            { name: "William Taylor", number: "5", position: "Midfielder" },
            { name: "Thomas Anderson", number: "6", position: "Forward" }
        ],
        stats: {
            wins: 5,
            losses: 2,
            ties: 1
        }
    },
    {
        name: "Blue Hawks",
        sport: "Soccer",
        ageGroup: "U12",
        location: "Springfield",
        coach: {
            name: "Sarah Johnson",
            contact: "sarah.j@email.com"
        },
        players: [
            { name: "Alex Thompson", number: "1", position: "Goalkeeper" },
            { name: "Chris Lee", number: "2", position: "Defender" },
            { name: "Sam Wilson", number: "3", position: "Defender" },
            { name: "Ryan Martinez", number: "4", position: "Midfielder" },
            { name: "Lucas Brown", number: "5", position: "Midfielder" },
            { name: "Ethan Davis", number: "6", position: "Forward" }
        ],
        stats: {
            wins: 4,
            losses: 3,
            ties: 1
        }
    },
    {
        name: "Green Tigers",
        sport: "Baseball",
        ageGroup: "U10",
        location: "Springfield",
        coach: {
            name: "Michael Brown",
            contact: "michael.b@email.com"
        },
        players: [
            { name: "Noah Wilson", number: "1", position: "Pitcher" },
            { name: "Liam Johnson", number: "2", position: "Catcher" },
            { name: "Oliver Smith", number: "3", position: "First Base" },
            { name: "Ethan Davis", number: "4", position: "Second Base" },
            { name: "Aiden Wilson", number: "5", position: "Shortstop" },
            { name: "Mason Brown", number: "6", position: "Third Base" }
        ],
        stats: {
            wins: 6,
            losses: 1,
            ties: 0
        }
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
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tinystats');
        console.log('Connected to MongoDB');

        // Clear existing data
        await Team.deleteMany({});
        await Game.deleteMany({});
        await Favorite.deleteMany({});
        console.log('Cleared existing data');

        // Insert teams
        const teams = await Team.insertMany(sampleTeams);
        console.log('Inserted teams');

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

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase(); 