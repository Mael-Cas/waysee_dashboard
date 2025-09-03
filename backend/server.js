import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import path from "path";
import bodyParser from "body-parser";
import { v4 as uuidv4 } from "uuid";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use("/videos", express.static("videos"));

// Vidéos stockées dans ce dossier
const VIDEO_DIR = "videos";
const METADATA_FILE = path.join(VIDEO_DIR, "metadata.json");

// Créer le dossier s'il n'existe pas
if (!fs.existsSync(VIDEO_DIR)) fs.mkdirSync(VIDEO_DIR);
if (!fs.existsSync(METADATA_FILE)) fs.writeFileSync(METADATA_FILE, JSON.stringify([]));

// Config multer pour upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, VIDEO_DIR),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// Lire les métadonnées
const readMetadata = () => JSON.parse(fs.readFileSync(METADATA_FILE));
const writeMetadata = (data) => fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2));

/**
 * Route: Lister toutes les vidéos
 */
app.get("/api/videos", (req, res) => {
    const metadata = readMetadata();
    res.json(metadata);
});

/**
 * Route: Upload une vidéo
 */
app.post("/api/upload", upload.single("video"), (req, res) => {
    const metadata = readMetadata();
    const newVideo = {
        id: uuidv4(),
        filename: req.file.filename,
        url: `${req.protocol}://${req.get("host")}/videos/${req.file.filename}`,
        description: req.body.description || ""
    };
    metadata.push(newVideo);
    writeMetadata(metadata);
    res.json({ message: "Vidéo uploadée avec succès", video: newVideo });
});

/**
 * Route: Supprimer une vidéo
 */
app.delete("/api/videos/:id", (req, res) => {
    const metadata = readMetadata();
    const index = metadata.findIndex((v) => v.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: "Vidéo non trouvée" });

    const video = metadata[index];
    fs.unlinkSync(path.join(VIDEO_DIR, video.filename));
    metadata.splice(index, 1);
    writeMetadata(metadata);

    res.json({ message: "Vidéo supprimée" });
});

/**
 * Route: Modifier la description d'une vidéo
 */
app.put("/api/videos/:id", (req, res) => {
    const metadata = readMetadata();
    const video = metadata.find((v) => v.id === req.params.id);
    if (!video) return res.status(404).json({ error: "Vidéo non trouvée" });

    video.description = req.body.description || video.description;
    writeMetadata(metadata);
    res.json({ message: "Description mise à jour", video });
});

app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
