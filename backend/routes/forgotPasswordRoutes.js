const express = require('express');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const db = require('../db');  // Your database connection

const router = express.Router();

router.post('/forgot-password', async (req, res) => {
    console.log(req.body)
    const { email } = req.body;
    console.log(email)

    
    const connection = await db.getConnection();

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    const [userResult] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (userResult.length === 0) {
        return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour from now

    console.log(user)

    await connection.execute('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE userID = ?', [token, expiry, user.userID]);


    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'firassimon5@gmail.com',
            pass: 'ftfr wcsw tsjk yzzv'
        }
    });

    const mailOptions = {
        to: email,
        from: 'admn.foodtogo@gmail.com',
        subject: 'Password Reset',
        text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
            `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
            `http://${req.headers.host}/reset-password/${token}\n\n` +
            `If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };

    transporter.sendMail(mailOptions, (err) => {
        if (err) {
            return res.status(500).json({ message: 'Error sending email' });
        }
        res.json({ message: 'Reset link sent' });
    });
});

router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    const [userResult] = await connection.execute('SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()', [token]);
    if (userResult.length === 0) {
        return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
    }

    const user = userResult[0];
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (user.type === "user") {
        await connection.execute('UPDATE user SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE user_ID = ?', [hashedPassword, user.user_ID]);
    } else if (user.type === "restaurant") {
        await connection.execute('UPDATE restaurant SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE user_ID = ?', [hashedPassword, user.user_ID]);
    } else if (user.type === "admin") {
        await connection.execute('UPDATE admin SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE user_ID = ?', [hashedPassword, user.user_ID]);
    }
    

    res.json({ message: 'Password has been reset' });
});

module.exports = router;


module.exports = router;
