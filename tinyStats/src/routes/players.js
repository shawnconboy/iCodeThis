const express = require('express');
const router = express.Router();
const Team = require('../models/Team');

// Search players across all teams
router.get('/search/:query', async (req, res) => {
    try {
        const query = req.params.query;
        const teams = await Team.find({
            'players.name': { $regex: query, $options: 'i' }
        });

        // Extract matching players from teams
        const players = teams.flatMap(team => {
            return team.players
                .filter(player => player.name.toLowerCase().includes(query.toLowerCase()))
                .map(player => ({
                    _id: `${team._id}-${player.number}`,
                    name: player.name,
                    number: player.number,
                    position: player.position,
                    teamId: team._id,
                    teamName: team.name
                }));
        });

        res.json(players);
    } catch (error) {
        console.error('Error searching players:', error);
        res.status(500).json({ message: 'Error searching players' });
    }
});

module.exports = router; 