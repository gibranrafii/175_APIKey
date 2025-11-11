const express = require('express');
const path = require('path');
const crypto = require('crypto');
const sequelize = require('./db/connection');
const ApiKey = require('./db/ApiKey');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Sync database
sequelize.sync().then(() => {
  console.log("Database ready");
});

// ==================== MIDDLEWARE CEK API KEY ====================
async function checkApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key']; // client harus kirim header: x-api-key: <apikey>

  if (!apiKey) return res.status(401).json({ error: "API Key tidak ada." });

  const keyExist = await ApiKey.findOne({ where: { key: apiKey } });

  if (!keyExist) return res.status(403).json({ error: "API Key tidak valid." });

  next();
}

// ==================== ENDPOINT BIASA ====================

app.get('/test', (req, res) => {
  res.send('Hello World!');
});

app.get('/secret', checkApiKey, (req, res) => {
  res.send('Akses diterima. API Key valid.');
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== CRUD API KEY ====================

// Get all API Keys
app.get('/api/keys', async (req, res) => {
  const keys = await ApiKey.findAll({ order: [['id', 'DESC']] });
  res.json(keys);
});

// Get API Key by ID
app.get('/api/keys/:id', async (req, res) => {
  const key = await ApiKey.findByPk(req.params.id);
  if (!key) return res.status(404).json({ error: "API Key tidak ditemukan." });
  res.json(key);
});

// Create New API Key
app.post('/api/keys', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Nama harus diisi." });

  const newKey = `API-${crypto.randomBytes(32).toString('hex')}`;
  const created = await ApiKey.create({ name, key: newKey });

  res.json(created);
});

// Reset API Key
app.put('/api/keys/:id', async (req, res) => {
  const key = await ApiKey.findByPk(req.params.id);
  if (!key) return res.status(404).json({ error: "API Key tidak ditemukan." });

  const newKey = `API-${crypto.randomBytes(32).toString('hex')}`;
  key.key = newKey;
  await key.save();

  res.json({ message: "API Key berhasil diperbarui.", key });
});

// Delete API Key
app.delete('/api/keys/:id', async (req, res) => {
  const deleted = await ApiKey.destroy({ where: { id: req.params.id } });
  if (!deleted) return res.status(404).json({ error: "API Key tidak ditemukan." });

  res.json({ message: "API Key berhasil dihapus." });
});

// ==================== CEK VALIDITAS API KEY (TES DI POSTMAN) ====================
app.post('/api/check', async (req, res) => {
  const { apiKey } = req.body; // Ambil dari body JSON

  if (!apiKey) {
    return res.status(400).json({ valid: false, reason: "apiKey harus dikirim di body JSON." });
  }

  const keyExist = await ApiKey.findOne({ where: { key: apiKey } });

  if (!keyExist) {
    return res.status(403).json({ valid: false, reason: "API Key tidak valid." });
  }

  res.json({ valid: true, message: "API Key valid.", data: keyExist });
});


// ==================== RUN SERVER ====================
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
