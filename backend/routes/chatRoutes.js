// chatRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // Adjust the path to your db module


// Middleware to authenticate JWT token
const verifyToken = require('../middlewares/verifyToken');

let io;

function setIoInstance(socketio) {
    io = socketio;
}

// Send a message
router.post('/send-message', verifyToken, async (req, res) => {
    const { receiver_ID, message } = req.body;
    const sender_ID = req.user.userId;

    if (!receiver_ID || !message) {
        return res.status(400).json({ message: 'Receiver ID and message are required' });
    }

    try {
        const connection = await db.getConnection();
        await connection.execute('INSERT INTO chat (senderId, recipientId, message) VALUES (?, ?, ?)', [sender_ID, receiver_ID, message]);

        io.emit('new-message', { senderId, receiverId, message });

        res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending message', error });
    }
});

// Get messages between two users
router.get('/get-messages/:receiver_ID', verifyToken, async (req, res) => {
    const sender_ID = req.user.userId;
    const receiver_ID = req.params.receiver_ID;

    if (!receiver_ID) {
        return res.status(400).json({ message: 'Receiver ID is required' });
    }

    try {
        const connection = await db.getConnection();
        const [messages] = await connection.execute(
            'SELECT * FROM chat WHERE (senderId = ? AND recipientId = ?) OR (senderId = ? AND recipientId = ?) ORDER BY timestamp ASC',
            [sender_ID, receiver_ID, receiver_ID, sender_ID]
        );
        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving messages', error });
    }
});


module.exports = router;
