const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middlewares/verifyToken');

const SECRET_KEY = '12345678'; // Replace with your actual secret key




router.post('/signin', async (req, res) => {
    const { email, password } = req.body;
    const connection = await db.getConnection();

    try {
        

        // Check if the user is an admin
        const [adminResult] = await connection.execute('SELECT * FROM admin WHERE email = ?', [email]);
        if (adminResult.length > 0) {
            const admin = adminResult[0];
            const isValidPassword = (password ===admin.password);
            if (isValidPassword) {
                const token = jwt.sign({ id: admin.id, role: 'admin' }, SECRET_KEY, { expiresIn: '24h' });
                res.json({ message: 'Login successful', token, role: 'admin' });
                return;
            }
        }

        // Check if the user is a restaurant
        const [restaurantResult] = await connection.execute('SELECT * FROM restaurant WHERE email = ?', [email]);
        if (restaurantResult.length > 0) {
            const restaurant = restaurantResult[0];
            const isValidPassword = await bcrypt.compare(password, restaurant.password);
            if (isValidPassword) {
                const token = jwt.sign({ id: restaurant.id, role: 'restaurant' }, SECRET_KEY, { expiresIn: '24h' });
                res.json({ message: 'Login successful', token, role: 'restaurant' });
                return;
            }
        }

        // Check if the user is a regular user
        const [userResult] = await connection.execute('SELECT * FROM user WHERE email = ?', [email]);
        if (userResult.length > 0) {
            const user = userResult[0];
            const isValidPassword = await await bcrypt.compare(password, user.password);
            console.log('Entered password:', password);
            console.log('Hashed password from DB:', user.password);
            console.log('Password comparison result:', isValidPassword);
            if (isValidPassword) {
                const token = jwt.sign({ id: user.id, role: 'user' }, SECRET_KEY, { expiresIn: '24h' });
                res.json({ message: 'Login successful', token, role: 'user' });
                return;
            }
        }

        res.status(401).json({ message: 'Invalid email or password' });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});


// Protected route example
router.get('/protected', verifyToken, (req, res) => {
    res.json({ message: 'Protected route accessed successfully', userId: req.userId, userRole: req.userRole });
});

module.exports = router;
