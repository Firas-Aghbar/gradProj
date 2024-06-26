// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const bcrypt = require('bcrypt');
const verifyToken = require('../middlewares/verifyToken');
const db = require('../db'); // Assuming you have a db.js file to handle MySQL connection

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Ensure this directory exists
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    },
});

const upload = multer({ storage });

// Register a new user
router.post('/register', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'cover_image', maxCount: 1 }]), async (req, res) => {
   
    try {
        const { name, email, password, address, phone_no, city, facebook_link, description } = req.body;
        const image = req.files['image'] ? req.files['image'][0].path : null;
        const cover_image = req.files['cover_image'] ? req.files['cover_image'][0].path : null;


        if (!name || !email || !password || !address || !phone_no || !city || !facebook_link || !image || !cover_image || !description ) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Start a transaction
        connection = await db.getConnection();
        await connection.beginTransaction();


        const [duplicateResult] = await connection.query('SELECT type FROM users WHERE email = ?', email);

        if (duplicateResult.length > 0) {
            res.status(409).json({ message: 'This email is already registered as ', duplicateResult });
            await connection.rollback();
            return;
        }


        await connection.query("INSERT INTO users (email, type) VALUES (?, 'restaurant')", email)

        const [result] = await connection.query("SELECT userID FROM users WHERE email = ?", email);
        const userid = result.length > 0 ? result[0].userID : null;

        
        // Insert into restaurant table
        await connection.query(`
            INSERT INTO restaurant ( user_ID, name, email, password, address, phone_no, city, facebook_page, image, cover_image, status, description)
            VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userid, name, email, hashedPassword, address, phone_no, city, facebook_link, image, cover_image, 'pending', description]);


        connection.release();        
       
        // Commit the transaction
        await connection.commit();


        res.status(201).json({ message: 'Restaurant pending admin approval.', restaurantId: result.insertId });
    } catch (error) {
        console.error('Error registering restaurant:', error);
        res.status(500).json({ message: 'Failed to register restaurant' });

        // Rollback the transaction in case of an error
        await connection.rollback();
        console.error(error);
        res.status(500).send('res Server error');
    }
});

router.get('/user-details', verifyToken, async (req, res) => {
    const userId = req.user.userId; // Assumes the token contains the userId

    try {
        const connection = await db.getConnection();
        const [result] = await connection.execute('SELECT name, image FROM restaurant WHERE user_ID = ?', [userId]);

        if (result.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = result[0];
        res.json({ name: user.name, image: user.image });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
});

router.use((error, req, res, next) => {
	console.log(' This is the unexpected field = ->', error.field);
});


// Export the router
module.exports = router;