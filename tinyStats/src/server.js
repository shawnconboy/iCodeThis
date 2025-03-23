const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tinystats')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Socket.IO Connection
io.on('connection', (socket) => {
    console.log('Client connected');
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get(['/team', '/team.html'], (req, res) => {
    res.sendFile(path.join(__dirname, '../public/team.html'));
});

// API Routes
const teamRoutes = require('./routes/teams');
const gamesRouter = require('./routes/games');
const favoritesRoutes = require('./routes/favorites');
const playerFavoritesRoutes = require('./routes/playerFavorites');
const playersRoutes = require('./routes/players');

app.use('/api/teams', teamRoutes);
app.use('/api/games', gamesRouter);
app.use('/api/favorites/players', playerFavoritesRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/players', playersRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 