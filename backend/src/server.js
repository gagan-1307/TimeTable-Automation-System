import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs'; // Required for file system operations

const app = express();
const PORT = 8080;

// Set up storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = 'uploads/';
        // Create the uploads directory if it doesn't exist
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Use the original file name
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

// Serve a basic HTML form for testing (optional)
app.get("/", (req, res) => {
    res.send("Hello, world!"); // Assumes an index.html file exists
});

// Endpoint to handle file uploads
app.post("/upload", upload.single('fileToUpload'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    console.log(req.file);
    res.send("File uploaded successfully!");
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
