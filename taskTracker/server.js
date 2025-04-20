const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 3000;
const FILE_PATH = 'tasks.json';

app.use(cors());
app.use(express.json());

// Load tasks
app.get('/tasks', (req, res) => {
    if (!fs.existsSync(FILE_PATH)) fs.writeFileSync(FILE_PATH, '[]');
    const data = fs.readFileSync(FILE_PATH, 'utf8');
    res.json(JSON.parse(data));
});

// Save tasks
app.post('/tasks', (req, res) => {
    const tasks = req.body;
    fs.writeFileSync(FILE_PATH, JSON.stringify(tasks, null, 2));
    res.json({ message: 'Tasks saved successfully' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
