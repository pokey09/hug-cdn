import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DATA_FILE = path.join(__dirname, 'cdn-data.json');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Load or initialize persistent data
function loadData() {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  }
  return {
    files: [],
    stats: {
      totalBandwidth: 0,
      totalRequests: 0,
      startedAt: new Date().toISOString(),
    },
  };
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

let data = loadData();

app.use(cors());
app.use(express.json());

// Configure multer for file uploads
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

// Upload files
app.post('/api/upload', upload.array('files', 20), (req, res) => {
  const uploaded = req.files.map((file) => {
    const fileRecord = {
      id: path.basename(file.filename, path.extname(file.filename)),
      name: file.originalname,
      size: file.size,
      type: file.mimetype || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
      storedName: file.filename,
    };
    data.files.unshift(fileRecord);
    return fileRecord;
  });

  saveData(data);

  // Return file records with CDN URLs
  const result = uploaded.map((f) => ({
    ...f,
    cdnUrl: `/cdn/${f.id}/${encodeURIComponent(f.name)}`,
  }));

  res.json(result);
});

// List all files
app.get('/api/files', (req, res) => {
  const filesWithUrls = data.files.map((f) => ({
    ...f,
    cdnUrl: `/cdn/${f.id}/${encodeURIComponent(f.name)}`,
  }));
  res.json(filesWithUrls);
});

// Delete a file
app.delete('/api/files/:id', (req, res) => {
  const { id } = req.params;
  const fileIndex = data.files.findIndex((f) => f.id === id);

  if (fileIndex === -1) {
    return res.status(404).json({ error: 'File not found' });
  }

  const file = data.files[fileIndex];
  const filePath = path.join(UPLOADS_DIR, file.storedName);

  // Remove from disk
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Remove from data
  data.files.splice(fileIndex, 1);
  saveData(data);

  res.json({ success: true });
});

// Get stats
app.get('/api/stats', (req, res) => {
  const totalFiles = data.files.length;
  const totalSize = data.files.reduce((acc, f) => acc + f.size, 0);
  const uptime = Date.now() - new Date(data.stats.startedAt).getTime();

  res.json({
    totalFiles,
    totalSize,
    totalBandwidth: data.stats.totalBandwidth,
    totalRequests: data.stats.totalRequests,
    uptime,
    status: 'Active',
  });
});

// Serve files (the actual CDN endpoint)
app.get('/cdn/:id/:filename', (req, res) => {
  const { id } = req.params;
  const file = data.files.find((f) => f.id === id);

  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  const filePath = path.join(UPLOADS_DIR, file.storedName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File missing from storage' });
  }

  // Track stats
  data.stats.totalRequests++;
  data.stats.totalBandwidth += file.size;
  saveData(data);

  // Set appropriate headers
  res.setHeader('Content-Type', file.type);
  res.setHeader('Content-Disposition', `inline; filename="${file.name}"`);
  res.setHeader('Content-Length', file.size);
  res.setHeader('Cache-Control', 'public, max-age=31536000');
  res.setHeader('X-CDN-Cache', 'HIT');

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

app.listen(PORT, () => {
  console.log(`CDN Server running at http://localhost:${PORT}`);
  console.log(`Uploads directory: ${UPLOADS_DIR}`);
  console.log(`Files stored: ${data.files.length}`);
});
