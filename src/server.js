const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/api');
require('dotenv').config(); // Load .env file locally

const app = express();

// Middleware
app.use(express.static(path.join(__dirname, '../public')));
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For Vercel