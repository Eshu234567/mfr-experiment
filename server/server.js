const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ---------- DB CONNECTION ----------
const db = new sqlite3.Database('./mfr.db', (err) => {
  if (err) {
    console.error('❌ Could not connect to database', err);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// ---------- TABLES ----------
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usn TEXT UNIQUE,
    name TEXT,
    password_hash TEXT
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS experiment_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usn TEXT,
    CA01 REAL,
    CB01 REAL,
    VR REAL,
    va REAL,
    vb REAL,
    CA REAL,
    student_k REAL,
    actual_k REAL,
    created_at TEXT
  )
`);

// ---------- AUTH APIs ----------
app.post('/api/signup', async (req, res) => {
  const { usn, name, password } = req.body;

  if (!usn || !name || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    db.run(
      `INSERT INTO users (usn, name, password_hash) VALUES (?, ?, ?)`,
      [usn, name, hash],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'USN already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({ message: 'Signup successful' });
      }
    );
  } catch (e) {
    res.status(500).json({ error: 'Signup failed' });
  }
});

app.post('/api/login', (req, res) => {
  const { usn, password } = req.body;

  if (!usn || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }

  db.get(
    `SELECT * FROM users WHERE usn = ?`,
    [usn],
    async (err, user) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (!user) return res.status(400).json({ error: 'Invalid USN or password' });

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return res.status(400).json({ error: 'Invalid USN or password' });

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          usn: user.usn,
          name: user.name
        }
      });
    }
  );
});

// ---------- EXPERIMENT API ----------
app.post('/api/run-experiment', (req, res) => {
  const { CA01, CB01, VR, va, vb } = req.body;

  const CA0p = parseFloat(CA01);
  const CB0p = parseFloat(CB01);
  const VRn = parseFloat(VR);
  const van = parseFloat(va);
  const vbn = parseFloat(vb);

  if ([CA0p, CB0p, VRn, van, vbn].some(v => isNaN(v) || v <= 0)) {
    return res.status(400).json({ error: 'Invalid input values' });
  }

  const vT = van + vbn;
  const CA0 = (CA0p * van) / vT;
  const CB0 = (CB0p * vbn) / vT;

  if (CB0 / CA0 < 1) {
    return res.status(400).json({
      error: 'Inconsistent data, A is not a limiting reactant'
    });
  }

  // hidden actual k
  const k = Math.random() * (0.5 - 0.25) + 0.25;

  const m = CB0 / CA0;
  const T = VRn / vT;

  let XA = 0.5;
  for (let i = 0; i < 100; i++) {
    const f = k * CA0 * T - XA / ((1 - XA) * (m - XA));
    const df =
      -1 / ((1 - XA) * (m - XA)) -
      XA * (-(m - XA) - (1 - XA) * -1) /
      Math.pow((1 - XA) * (m - XA), 2);

    XA = XA - f / df;
    if (XA < 0.01) XA = 0.01;
    if (XA > 0.99) XA = 0.99;
  }

  const CA = CA0 * (1 - XA);

  // IMPORTANT: send actual k only for DB storage, not UI
  res.json({ CA, actual_k: k });
});
// ---------- UPDATE STUDENT K FOR LATEST RUN ----------
app.post('/api/update-student-k', (req, res) => {
  const { usn, student_k } = req.body;

  if (!usn || typeof student_k !== 'number') {
    return res.status(400).json({ error: 'Invalid input' });
  }

  db.run(
    `
    UPDATE experiment_runs
    SET student_k = ?
    WHERE id = (
      SELECT id FROM experiment_runs
      WHERE usn = ?
      ORDER BY created_at DESC
      LIMIT 1
    )
    `,
    [student_k, usn],
    function (err) {
      if (err) {
        console.error('❌ Update student_k error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ message: 'student_k updated successfully' });
    }
  );
});

// ---------- SAVE RUN API (NEW) ----------
app.post('/api/save-run', (req, res) => {
  const {
    usn,
    CA01,
    CB01,
    VR,
    va,
    vb,
    CA,
    student_k,
    actual_k
  } = req.body;

  if (!usn || CA01 == null || CB01 == null || VR == null || va == null || vb == null || CA == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const created_at = new Date().toISOString();

  db.run(
    `
    INSERT INTO experiment_runs
    (usn, CA01, CB01, VR, va, vb, CA, student_k, actual_k, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [usn, CA01, CB01, VR, va, vb, CA, student_k, actual_k, created_at],
    function (err) {
      if (err) {
        console.error('❌ Save run error:', err);
        return res.status(500).json({ error: 'Database error while saving run' });
      }

      res.json({ message: 'Run saved successfully', id: this.lastID });
    }
  );
});

// ---------- FETCH STUDENT RUNS API (NEW) ----------
app.get('/api/runs/:usn', (req, res) => {
  const { usn } = req.params;
  // ---------- FETCH ALL RUNS (TEACHER) ----------
app.get('/api/all-runs', (req, res) => {
  db.all(
    `
    SELECT 
      experiment_runs.*,
      users.name
    FROM experiment_runs
    LEFT JOIN users ON users.usn = experiment_runs.usn
    ORDER BY experiment_runs.created_at ASC
    `,
    [],
    (err, rows) => {
      if (err) {
        console.error('❌ Fetch all runs error:', err);
        return res.status(500).json({ error: 'Database error while fetching all runs' });
      }

      res.json({ runs: rows });
    }
  );
});

  // ---------- DELETE ALL RUNS FOR A STUDENT ----------
app.delete('/api/runs/:usn', (req, res) => {
  const { usn } = req.params;

  db.run(
    `DELETE FROM experiment_runs WHERE usn = ?`,
    [usn],
    function (err) {
      if (err) {
        console.error('❌ Delete runs error:', err);
        return res.status(500).json({ error: 'Database error while deleting runs' });
      }

      res.json({ message: 'All runs deleted successfully' });
    }
  );
});


  db.all(
    `
    SELECT *
    FROM experiment_runs
    WHERE usn = ?
    ORDER BY created_at ASC
    `,
    [usn],
    (err, rows) => {
      if (err) {
        console.error('❌ Fetch runs error:', err);
        return res.status(500).json({ error: 'Database error while fetching runs' });
      }

      res.json({ runs: rows });
    }
  );
});

// ---------- SERVER ----------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
