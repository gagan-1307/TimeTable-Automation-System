// Vercel serverless function entry point.
// Vercel calls this file as a Node.js handler — it imports and re-exports
// the Express app from the backend, which handles all /api/* routes.
const app = require('../backend/src/index');

module.exports = app;
