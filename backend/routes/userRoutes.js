// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const bcrypt = require('bcrypt');
const db = require('../db'); // Assuming you have a db.js file to handle MySQL connection
const verifyToken = require('../middlewares/verifyToken');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Register a new user
router.post('/register', upload.single('image'), async(req, res) => {
	try {

		// Extract user registration data from request body
		const { first_name, last_name, email, password, address, phone_no, gender, city } = req.body;
        const image = req.file ? req.file.buffer : null; // Access the image file data

        console.log(image);

		// Validate input data (e.g., check for required fields, validate email format, etc.)
		if (!first_name || !last_name || !email || !password || !address || !phone_no || !gender || !city  ) {
			return res.status(400).json({ message: 'All fields except images are required' });
		}
		// Hash the password (using bcrypt or a similar library)
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

        await connection.query("INSERT INTO users (email, type) VALUES (?, 'user')", email)

        const [result] = await connection.query("SELECT userID FROM users WHERE email = ?", email);
        const userid = result.length > 0 ? result[0].userID : null;

		

        // Insert into restaurant table
        await connection.query(`
            INSERT INTO user ( user_ID, first_name, last_name, email, password, address, phone_no, gender, city, image)
            VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[userid, first_name, last_name, email, hashedPassword, address, phone_no, gender, city, image]);


        connection.release()

        // Commit the transaction
        await connection.commit();
		res.status(201).json({ message: 'User registered successfully:' });
	} catch (error) {
		console.error('Error registering user:', error);
		res.status(500).json({ message: 'Failed to register user' });
	}
});

router.get('/user-details', verifyToken, async (req, res) => {
    const userId = req.user.userId; // Assumes the token contains the userId

    try {
        const connection = await db.getConnection();
        const [result] = await connection.execute('SELECT first_name, last_name, image FROM users WHERE user_ID = ?', [userId]);

        if (result.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = result[0];
        res.json({ firstName: user.first_name, lastName: user.last_name, image: user.image });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
});

router.use((error, req, res, next) => {
	console.log(' This is the unexpected field = ->', error.field);
});


// Export the router
module.exports = router;