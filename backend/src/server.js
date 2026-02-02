import dotenv from 'dotenv';
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs'; // Required for file system operations

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Hello World endpoint
app.get('/', (req, res) => {
    res.send('Hello, World!');
});


import connectDB from './config/db.js';

// Start server
const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
};

startServer();
