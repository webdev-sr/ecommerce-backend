const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = 3000;

// PostgreSQL connection config
const pool = new Pool({
  user: 'postgres',
  host: 'your-project.supabase.co',
  database: 'saree_world1',
  password: 'Root@2006',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});


// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve static frontend pages
app.use('/pages', express.static(path.join(__dirname, '../frontend/pages')));

// Default route
app.get('/', (req, res) => {
  res.redirect('/pages/login.html');
});

// POST: Register
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if user exists
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).send('Email already registered. <a href="/pages/register.html">Try again</a>');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
      [name, email, hashedPassword]
    );

    res.send('Registration successful. <a href="/pages/login.html">Login here</a>');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error during registration.');
  }
});

// POST: Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(400).send('Invalid email or password. <a href="/pages/login.html">Try again</a>');
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).send('Invalid email or password. <a href="/pages/login.html">Try again</a>');
    }

    res.send(`Welcome, ${user.name}! You have successfully logged in.`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error during login.');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running at http://localhost:${PORT}`);
});
