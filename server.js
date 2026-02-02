import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import mysql from 'mysql2/promise';
import { randomUUID, randomBytes } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8082;

const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// MySQL connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

const PASSWORD = process.env.CDN_PASSWORD;
const activeSessions = new Set();

function generateToken() {
  return randomUUID() + '-' + Date.now().toString(36);
}

function generateApiKey() {
  return 'cdn_' + randomBytes(24).toString('hex');
}

async function requireAuth(req, res, next) {
  // Check Bearer token
  const bearerToken = req.headers.authorization?.replace('Bearer ', '');
  if (bearerToken && activeSessions.has(bearerToken)) {
    return next();
  }

  // Check API key
  const apiKey = req.headers['x-api-key'];
  if (apiKey) {
    const [rows] = await db.query('SELECT id FROM api_keys WHERE api_key = ?', [apiKey]);
    if (rows.length > 0) {
      db.query('UPDATE api_keys SET last_used_at = NOW() WHERE api_key = ?', [apiKey]);
      return next();
    }
  }

  return res.status(401).json({ error: 'Unauthorized' });
}

app.use(cors());
app.use(express.json());

// Login endpoint (no auth required)
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === PASSWORD) {
    const token = generateToken();
    activeSessions.add(token);
    return res.json({ token });
  }
  res.status(401).json({ error: 'Invalid password' });
});

// Verify token endpoint
app.get('/api/verify', requireAuth, (req, res) => {
  res.json({ valid: true });
});

// --- API Key Management ---

app.post('/api/keys', requireAuth, async (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Key name is required' });
  }

  const keyRecord = {
    id: randomUUID(),
    key: generateApiKey(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
  };

  await db.query(
    'INSERT INTO api_keys (id, api_key, name) VALUES (?, ?, ?)',
    [keyRecord.id, keyRecord.key, keyRecord.name]
  );

  res.json(keyRecord);
});

app.get('/api/keys', requireAuth, async (req, res) => {
  const [rows] = await db.query('SELECT id, api_key, name, created_at, last_used_at FROM api_keys ORDER BY created_at DESC');
  const masked = rows.map((k) => ({
    id: k.id,
    name: k.name,
    keyPreview: k.api_key.substring(0, 8) + '...' + k.api_key.substring(k.api_key.length - 4),
    createdAt: k.created_at,
    lastUsedAt: k.last_used_at,
  }));
  res.json(masked);
});

app.delete('/api/keys/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const [result] = await db.query('DELETE FROM api_keys WHERE id = ?', [id]);
  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'API key not found' });
  }
  res.json({ success: true });
});

// --- File Management ---

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const id = randomUUID();
    const ext = path.extname(file.originalname);
    cb(null, `${id}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

app.post('/api/upload', requireAuth, upload.array('files', 20), async (req, res) => {
  const uploaded = [];

  for (const file of req.files) {
    const id = path.basename(file.filename, path.extname(file.filename));
    const record = {
      id,
      name: file.originalname,
      size: file.size,
      type: file.mimetype || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
      storedName: file.filename,
    };

    await db.query(
      'INSERT INTO files (id, name, size, type, stored_name) VALUES (?, ?, ?, ?, ?)',
      [record.id, record.name, record.size, record.type, record.storedName]
    );

    uploaded.push(record);
  }

  const result = uploaded.map((f) => ({
    ...f,
    cdnUrl: `/cdn/${f.id}/${encodeURIComponent(f.name)}`,
  }));

  res.json(result);
});

app.get('/api/files', requireAuth, async (req, res) => {
  const [rows] = await db.query('SELECT id, name, size, type, uploaded_at, stored_name FROM files ORDER BY uploaded_at DESC');
  const filesWithUrls = rows.map((f) => ({
    id: f.id,
    name: f.name,
    size: f.size,
    type: f.type,
    uploadedAt: f.uploaded_at,
    storedName: f.stored_name,
    cdnUrl: `/cdn/${f.id}/${encodeURIComponent(f.name)}`,
  }));
  res.json(filesWithUrls);
});

app.delete('/api/files/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const [rows] = await db.query('SELECT stored_name FROM files WHERE id = ?', [id]);

  if (rows.length === 0) {
    return res.status(404).json({ error: 'File not found' });
  }

  const filePath = path.join(UPLOADS_DIR, rows[0].stored_name);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await db.query('DELETE FROM files WHERE id = ?', [id]);

  res.json({ success: true });
});

app.get('/api/stats', requireAuth, async (req, res) => {
  const [fileStats] = await db.query('SELECT COUNT(*) AS totalFiles, COALESCE(SUM(size), 0) AS totalSize FROM files');
  const [statsRow] = await db.query('SELECT total_bandwidth, total_requests, started_at FROM stats WHERE id = 1');

  const stats = statsRow[0] || { total_bandwidth: 0, total_requests: 0, started_at: new Date() };

  res.json({
    totalFiles: fileStats[0].totalFiles,
    totalSize: Number(fileStats[0].totalSize),
    totalBandwidth: Number(stats.total_bandwidth),
    totalRequests: Number(stats.total_requests),
    uptime: Date.now() - new Date(stats.started_at).getTime(),
    status: 'Active',
  });
});

// Serve files (public, no auth)
app.get('/cdn/:id/:filename', async (req, res) => {
  const { id } = req.params;
  const [rows] = await db.query('SELECT name, size, type, stored_name FROM files WHERE id = ?', [id]);

  if (rows.length === 0) {
    return res.status(404).json({ error: 'File not found' });
  }

  const file = rows[0];
  const filePath = path.join(UPLOADS_DIR, file.stored_name);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File missing from storage' });
  }

  // Track stats
  await db.query('UPDATE stats SET total_requests = total_requests + 1, total_bandwidth = total_bandwidth + ? WHERE id = 1', [file.size]);

  res.setHeader('Content-Type', file.type);
  res.setHeader('Content-Disposition', `inline; filename="${file.name}"`);
  res.setHeader('Content-Length', file.size);
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  res.setHeader('X-CDN-Cache', 'HIT');

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

// Start server with Vite middleware for dev
async function start() {
  // Verify database connection
  try {
    await db.query('SELECT 1');
    console.log('MySQL connected to cdn_sys');
  } catch (err) {
    console.error('MySQL connection failed:', err.message);
    process.exit(1);
  }

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  app.listen(PORT, '::', () => {
    console.log(`CDN Server running at http://localhost:${PORT}`);
    console.log(`Uploads directory: ${UPLOADS_DIR}`);
  });
}

start();
