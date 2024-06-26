const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

// Endpoint to handle contact form submissions
router.post('/contact', async (req, res) => {
    const { email, message } = req.body;

    if (!email || !message) {
        return res.status(400).json({ message: 'Email and message are required' });
    }

    console.log(email)


    // Configure the email transport using SMTP
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com', // Replace with your SMTP host
        port: 587, // Replace with your SMTP port
        secure: false, // true for 465, false for other ports
        auth: {
            user: 'firassimon5@gmail.com', // Replace with your email
            pass: 'ftfr wcsw tsjk yzzv' // Replace with your email password
        }
    });

    const mailOptions = {
        from: 'firassimon5@gmail.com', // sender address
        to: 'admn.foodtogo@gmail.com', // list of receivers
        subject: 'Contact Form Submission', // Subject line
        text: message, // plain text body
        replyTo: email,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ message: 'Message sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending message', error });
    }
});

module.exports = router;
