// Vercel serverless function entry point
const app = require('../src/server');

// Vercel expects the Express app to be exported directly
// The @vercel/node runtime will wrap it as a handler
module.exports = app;
