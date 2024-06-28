// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')
const userRoutes = require('./routes/userRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes')
const forgotPasswordRoutes = require('./routes/forgotPasswordRoutes');
const generalRoutes = require('./routes/generalRoutes')
const chatRoutes = require('./routes/chatRoutes');
const { setUp } = require('./dbConnection');
const app = express();
const PORT = process.env.PORT || 3010;

app.use(cors({
    origin: 'http://localhost:3000'
}));

app.options('/api/users/register', (req, res) => {
    res.header('Access-Control-Allow-Methods', 'POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).end();
});

// Middleware to parse JSON requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json())


// Use route handlers
app.use('/api/users', userRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/general', generalRoutes);
app.use('/api/forgotPassword', forgotPasswordRoutes);
app.use('api/chat', chatRoutes);





app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

setUp()