const express = require('express');
const path = require('path');
const apiRoutes = require('./routes/api');
require('dotenv').config();

const app = express();
const SECRET_TOKEN = process.env.SECRET_TOKEN;

function authenticateToken(req, res, next) {
    const token = req.query.token;
    if (!token || token !== SECRET_TOKEN) {
        return res.status(403).send('Access Denied: Invalid or missing token');
    }
    next();
}

// Serve static files first, no authentication required
app.use(express.static(path.join(__dirname, '../public')));

// Apply authentication to specific routes
app.use('/api', authenticateToken, apiRoutes);

app.get('/', authenticateToken, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;