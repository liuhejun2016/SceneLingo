import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, 'scenelingo.db'));

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS scenes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    image_data TEXT NOT NULL,
    style TEXT,
    language TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    author TEXT,
    likes INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS words (
    id TEXT PRIMARY KEY,
    scene_id TEXT NOT NULL,
    word TEXT NOT NULL,
    translation TEXT NOT NULL,
    pronunciation TEXT NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    FOREIGN KEY(scene_id) REFERENCES scenes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    scene_id TEXT NOT NULL,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(scene_id) REFERENCES scenes(id) ON DELETE CASCADE
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get('/api/scenes', (req, res) => {
    try {
      const scenes = db.prepare('SELECT id, title, image_data, style, language, created_at, author, likes FROM scenes ORDER BY created_at DESC').all();
      res.json(scenes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch scenes' });
    }
  });

  app.get('/api/scenes/:id', (req, res) => {
    try {
      const scene = db.prepare('SELECT * FROM scenes WHERE id = ?').get(req.params.id);
      if (!scene) return res.status(404).json({ error: 'Scene not found' });
      
      const words = db.prepare('SELECT * FROM words WHERE scene_id = ?').all(req.params.id);
      res.json({ ...scene, words });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch scene' });
    }
  });

  app.post('/api/scenes', (req, res) => {
    const { id, title, image_data, style, language, author, words } = req.body;
    
    try {
      const insertScene = db.prepare('INSERT INTO scenes (id, title, image_data, style, language, author) VALUES (?, ?, ?, ?, ?, ?)');
      const insertWord = db.prepare('INSERT INTO words (id, scene_id, word, translation, pronunciation, x, y) VALUES (?, ?, ?, ?, ?, ?, ?)');
      
      db.transaction(() => {
        insertScene.run(id, title, image_data, style, language, author || 'Anonymous');
        for (const word of words) {
          insertWord.run(word.id, id, word.word, word.translation, word.pronunciation, word.x, word.y);
        }
      })();
      
      res.status(201).json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to save scene' });
    }
  });

  app.post('/api/scenes/:id/like', (req, res) => {
    try {
      db.prepare('UPDATE scenes SET likes = likes + 1 WHERE id = ?').run(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to like scene' });
    }
  });

  app.get('/api/scenes/:id/comments', (req, res) => {
    try {
      const comments = db.prepare('SELECT * FROM comments WHERE scene_id = ? ORDER BY created_at DESC').all(req.params.id);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  });

  app.post('/api/scenes/:id/comments', (req, res) => {
    const { id, author, content } = req.body;
    try {
      db.prepare('INSERT INTO comments (id, scene_id, author, content) VALUES (?, ?, ?, ?)')
        .run(id, req.params.id, author || 'Anonymous', content);
      res.status(201).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add comment' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
