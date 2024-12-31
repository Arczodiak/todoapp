const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const SECRET_KEY = "supersecretkey";

// Set up SQLite database
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
    db.run(`CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)`);
    db.run(`CREATE TABLE tasks (id INTEGER PRIMARY KEY, title TEXT, description TEXT, dueDate TEXT, userId INTEGER)`);
});

// Helper: Authenticate user with JWT
function authenticate(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: "Invalid token" });
    }
}

// Routes
app.get('/', (req, res) => {
    res.send('Welcome to the To-Do App API! Use the API endpoints to interact.');
});

app.get('/browser-client', (req, res) => {
    res.sendFile(path.join(__dirname, 'browser-client.html'));
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function(err) {
        if (err) return res.status(400).json({ error: "User already exists" });
        res.status(201).json({ message: "User registered" });
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY);
        res.json({ token });
    });
});

app.get('/tasks', authenticate, (req, res) => {
    db.all(`SELECT * FROM tasks WHERE userId = ?`, [req.user.id], (err, rows) => {
        res.json(rows);
    });
});

app.post('/tasks', authenticate, (req, res) => {
    const { title, description, dueDate } = req.body;
    db.run(`INSERT INTO tasks (title, description, dueDate, userId) VALUES (?, ?, ?, ?)`,
        [title, description, dueDate, req.user.id],
        function(err) {
            if (err) return res.status(400).json({ error: "Error creating task" });
            res.status(201).json({ id: this.lastID, title, description, dueDate });
        }
    );
});

app.put('/tasks/:taskId', authenticate, (req, res) => {
    const { title, description, dueDate } = req.body;
    db.run(`UPDATE tasks SET title = ?, description = ?, dueDate = ? WHERE id = ? AND userId = ?`,
        [title, description, dueDate, req.params.taskId, req.user.id],
        function(err) {
            if (err || this.changes === 0) return res.status(404).json({ error: "Task not found" });
            res.json({ message: "Task updated" });
        }
    );
});

app.delete('/tasks/:taskId', authenticate, (req, res) => {
    db.run(`DELETE FROM tasks WHERE id = ? AND userId = ?`, [req.params.taskId, req.user.id], function(err) {
        if (err || this.changes === 0) return res.status(404).json({ error: "Task not found" });
        res.json({ message: "Task deleted" });
    });
});

// Start server
app.listen(3000, () => console.log('Server running on http://localhost:3000'));
