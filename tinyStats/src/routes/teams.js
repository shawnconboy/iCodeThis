const express = require('express');
const router = express.Router();
const Team = require('../models/Team');

// Get all teams
router.get('/', async (req, res) => {
    try {
        const teams = await Team.find();
        res.json(teams);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Search teams
router.get('/search/:query', async (req, res) => {
    try {
        const query = req.params.query;
        const teams = await Team.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { sport: { $regex: query, $options: 'i' } },
                { location: { $regex: query, $options: 'i' } },
                { 'players.name': { $regex: query, $options: 'i' } }
            ]
        });

        // Process teams to include matching players
        const processedTeams = teams.map(team => {
            const teamObj = team.toObject();
            if (team.players) {
                // Filter players that match the search query
                teamObj.matchingPlayers = team.players.filter(player => 
                    player.name.toLowerCase().includes(query.toLowerCase())
                );
            }
            return teamObj;
        });

        res.json(processedTeams);
    } catch (error) {
        console.error('Error searching teams:', error);
        res.status(500).json({ message: 'Error searching teams' });
    }
});

// Get single team
router.get('/:id', async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }
        res.json(team);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create team
router.post('/', async (req, res) => {
    const team = new Team({
        name: req.body.name,
        sport: req.body.sport,
        ageGroup: req.body.ageGroup,
        players: req.body.players || []
    });

    try {
        const newTeam = await team.save();
        res.status(201).json(newTeam);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update team
router.patch('/:id', async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }
        if (req.body.name) team.name = req.body.name;
        if (req.body.sport) team.sport = req.body.sport;
        if (req.body.ageGroup) team.ageGroup = req.body.ageGroup;
        if (req.body.players) team.players = req.body.players;
        
        const updatedTeam = await team.save();
        res.json(updatedTeam);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete team
router.delete('/:id', async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (!team) {
            return res.status(404).json({ message: 'Team not found' });
        }
        await team.deleteOne();
        res.json({ message: 'Team deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 