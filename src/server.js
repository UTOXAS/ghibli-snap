const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/api');
require('dotenv').config();

const app = express();
const SECRET_TOKEN = process.env.SECRET_TOKEN;

// Middleware to parse JSON bodies
app.use(express.json());

// Apply authentication to API routes only
function authenticateToken(req, res, next) {
    const token = req.query.token;
    if (!token || token !== SECRET_TOKEN) {
        return res.status(403).send('Access Denied: Invalid or missing token');
    }
    next();
}

app.use('/api', authenticateToken, apiRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;