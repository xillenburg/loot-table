const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors()); 
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'images')));


app.get('/api/images', (req, res) => {
  fs.readdir(path.join(__dirname, 'images'), (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Cannot read images directory' });
    }
    const pngFiles = files.filter(file => file.endsWith('.png'));
    res.json({ 
      message: 'Backend is working!',
      imageCount: pngFiles.length,
      images: pngFiles
    });
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📁 Serving images from: ${path.join(__dirname, 'images')}`);
});

app.use(express.static(path.join(__dirname, '../frontend')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});