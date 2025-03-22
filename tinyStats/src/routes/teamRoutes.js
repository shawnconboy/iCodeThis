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

// Get team by ID
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

// Search teams
router.get('/search/:query', async (req, res) => {
    try {
        const teams = await Team.find({
            $or: [
                { name: { $regex: req.params.query, $options: 'i' } },
                { location: { $regex: req.params.query, $options: 'i' } },
                { sport: { $regex: req.params.query, $options: 'i' } }
            ]
        });
        res.json(teams);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new team
router.post('/', async (req, res) => {
    const team = new Team(req.body);
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
        Object.assign(team, req.body);
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
        await team.remove();
        res.json({ message: 'Team deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 