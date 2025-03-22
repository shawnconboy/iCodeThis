const express = require('express');
const router = express.Router();
const Team = require('../models/Team');

// Get all teams
router.get('/', async (req, res) => {
    try {
        const teams = await Team.find();
        res.json(teams);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single team
router.get('/:id', async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        if (team) {
            res.json(team);
        } else {
            res.status(404).json({ message: 'Team not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Search teams
router.get('/search/:query', async (req, res) => {
    try {
        const searchRegex = new RegExp(req.params.query, 'i');
        const teams = await Team.find({
            $or: [
                { name: searchRegex },
                { sport: searchRegex },
                { ageGroup: searchRegex },
                { location: searchRegex }
            ]
        });
        res.json(teams);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router; 