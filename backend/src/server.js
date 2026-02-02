import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs'; // Required for file system operations

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Hello World endpoint
app.get('/', (req, res) => {
    res.send('Hello, World!');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
