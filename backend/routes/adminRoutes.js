const express = require('express');
const router = express.Router();
const multer = require('multer');
const bcrypt = require('bcrypt');
const db = require('../db'); // Assuming you have a db.js file to handle MySQL connection
const verifyToken = require('../middlewares/verifyToken');
const { connect } = require('./restaurantRoutes');

router.use(verifyToken);

const isAdmin = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized. Only admins can access this route.' });
    }
    next();
};

router.get('/user-details', verifyToken, async (req, res) => {
    const userId = req.user.userId; // Assumes the token contains the userId

    try {
        const connection = await db.getConnection();
        const [result] = await connection.execute('SELECT * FROM admin WHERE user_ID = ?', [userId]);

        if (result.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = result[0];
        res.json({ name: user.name });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error });
    }
});

router.post('/restaurants/update-status', verifyToken, async (req, res) => {
    const { email , status } = req.body; // id and status should be passed in the request body

    // Ensure the user is an admin
    if (req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Only admins can update restaurant status' });
    }

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Status must be either "approved" or "rejected".' });
    }

    const connection = await db.getConnection();

    try {
        
        const [result] = await connection.execute(
            'UPDATE restaurant SET status = ? WHERE email = ?',
            [status, email]
        );
        connection.release();

        if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Restaurant not found' });
        } else {
            res.status(200).json({ message: `Restaurant status updated to ${status}` });
        }
    } catch (error) {
        console.error('Error updating restaurant status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/sales-data', verifyToken, async (req, res) => {
    const connection = await db.getConnection();
    try {
        const [all_sales] = await connection.execute('SELECT Sum(total_price) AS tot FROM orders')

        // Query to get the sales data for the last 30 days
        const [currentPeriodRows] = await connection.execute(`
            SELECT DATE_FORMAT(purchase_date, '%b-%d') AS date, SUM(total_price) AS sales
            FROM orders
            WHERE purchase_date >= CURDATE() - INTERVAL 30 DAY
            GROUP BY purchase_date
            ORDER BY purchase_date
        `);

        // Query to get the sales data for the previous 30 days
        const [previousPeriodRows] = await connection.execute(`
            SELECT SUM(total_price) AS sales
            FROM orders
            WHERE purchase_date >= CURDATE() - INTERVAL 60 DAY AND purchase_date < CURDATE() - INTERVAL 30 DAY
        `);

        const labels = currentPeriodRows.map(row => row.date);
        const currentPeriodSales = currentPeriodRows.map(row => row.sales);
        const previousPeriodSales = previousPeriodRows[0].sales || 0;

        const totalCurrentSales = currentPeriodSales.reduce((a, b) => a + b, 0);
        const percentageChange = ((totalCurrentSales - previousPeriodSales) / previousPeriodSales) * 100;

        res.json({
            totalSales: all_sales[0].tot,
            percentageChange,
            labels,
            sales: currentPeriodSales,
        });
    } catch (error) {
        console.error('Error fetching sales data:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (connection) connection.release();
    }
});

router.get('/total-users', verifyToken, async (req, res) => {
    const connection = await db.getConnection();
    try {

        const [all_users] = await connection.execute('SELECT COUNT(*) AS tot FROM user')

        // Query to get the visitors data for the last 30 days
        const [currentPeriodRows] = await connection.execute(`
            SELECT DATE_FORMAT(registration_date, '%b-%d') AS date, COUNT(*) AS visitors
            FROM user
            WHERE registration_date >= CURDATE() - INTERVAL 7 DAY
            GROUP BY registration_date
            ORDER BY registration_date
        `);

        // Query to get the visitors data for the previous 30 days
        const [previousPeriodRows] = await connection.execute(`
            SELECT COUNT(*) AS visitors
            FROM user
            WHERE registration_date >= CURDATE() - INTERVAL 14 DAY AND registration_date < CURDATE() - INTERVAL 7 DAY
        `);

        const labels = currentPeriodRows.map(row => row.date);
        const currentPeriodVisitors = currentPeriodRows.map(row => row.visitors);
        const previousPeriodVisitors = previousPeriodRows[0].visitors || 0;

        const totalCurrentVisitors = currentPeriodVisitors.reduce((a, b) => a + b, 0);
        const percentageChange = ((totalCurrentVisitors - previousPeriodVisitors) / previousPeriodVisitors) * 100;

        res.json({
            totalVisitors: all_users[0].tot,
            percentageChange,
            labels,
            visitors: currentPeriodVisitors,
        });
    } catch (error) {
        console.error('Error fetching visitor data:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (connection) connection.release();
    }
});

router.get('/recent-registrations', verifyToken, async (req, res) => {
    const connection = await db.getConnection();
    try {


        // Query to get the count of new users for the last 7 days
        const [currentPeriodRows] = await connection.execute(`
            SELECT DATE_FORMAT(registration_date, '%b-%d') AS date, COUNT(*) AS new_users
            FROM user
            WHERE registration_date >= CURDATE() - INTERVAL 7 DAY
            GROUP BY registration_date
            ORDER BY registration_date
        `);

        // Query to get the count of new users for the 7 days before the last 7 days
        const [previousPeriodRows] = await connection.execute(`
            SELECT COUNT(*) AS new_users
            FROM user
            WHERE registration_date >= CURDATE() - INTERVAL 14 DAY AND registration_date < CURDATE() - INTERVAL 7 DAY
        `);

        const labels = currentPeriodRows.map(row => row.date);
        const currentPeriodNewUsers = currentPeriodRows.map(row => row.new_users);
        const previousPeriodNewUsers = previousPeriodRows[0].new_users || 0;

        const totalCurrentNewUsers = currentPeriodNewUsers.reduce((a, b) => a + b, 0);
        const percentageChange = ((totalCurrentNewUsers - previousPeriodNewUsers) / previousPeriodNewUsers) * 100;

        res.json({
            totalNewUsers: totalCurrentNewUsers,
            percentageChange,
            labels,
            newUsers: currentPeriodNewUsers,
        });
    } catch (error) {
        console.error('Error fetching new users data:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (connection) connection.release();
    }
});

router.get('/total-orders', verifyToken, async (req, res) => {
    const connection = await db.getConnection();
    try {

        const [all_orders] = await connection.execute('SELECT COUNT(*) AS tot FROM orders')

        // Query to get the count of total orders for the last 7 days
        const [currentPeriodRows] = await connection.execute(`
            SELECT DATE_FORMAT(purchase_date, '%b-%d') AS date, COUNT(*) AS total_orders
            FROM orders
            WHERE purchase_date >= CURDATE() - INTERVAL 30 DAY
            GROUP BY purchase_date
            ORDER BY purchase_date
        `);

        // Query to get the count of total orders for the 7 days before the last 7 days
        const [previousPeriodRows] = await connection.execute(`
            SELECT COUNT(*) AS total_orders
            FROM orders
            WHERE purchase_date >= CURDATE() - INTERVAL 60 DAY AND purchase_date < CURDATE() - INTERVAL 30 DAY
        `);

        const labels = currentPeriodRows.map(row => row.date);
        const currentPeriodTotalOrders = currentPeriodRows.map(row => row.total_orders);
        const previousPeriodTotalOrders = previousPeriodRows[0].total_orders || 0;

        const totalCurrentOrders = currentPeriodTotalOrders.reduce((a, b) => a + b, 0);
        const percentageChange = ((totalCurrentOrders - previousPeriodTotalOrders) / previousPeriodTotalOrders) * 100;

        res.json({
            totalOrders: all_orders[0].tot,
            percentageChange,
            labels,
            totalOrdersData: currentPeriodTotalOrders,
        });
    } catch (error) {
        console.error('Error fetching total orders data:', error);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (connection) connection.release();
    }
});

router.get('/recent-order', verifyToken, async (req, res) => {
    // Ensure the user is an admin
    if (req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Only admins can access this endpoint' });
    }

    const connection = await db.getConnection();

    try {
        

        const [recentOrder] = await connection.execute(
            `SELECT o.product_ID, p.name AS product_name, o.total_price 
            FROM orders o
            JOIN product p ON o.product_ID = p.product_ID
            ORDER BY o.purchase_date DESC
            LIMIT 1`
        );

        connection.release();

        if (recentOrder.length === 0) {
            return res.status(404).json({ message: 'No orders found' });
        }

        const order = recentOrder[0];
        res.status(200).json({
            product_ID: order.product_ID,
            product_name: order.product_name,
            price: order.total_price
        });
    } catch (error) {
        console.error('Error retrieving recent order:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/trending-products', verifyToken, async (req, res) => {
    try {
        // Execute SQL query to get trending products
        const [rows] = await db.execute(`
            SELECT p.name AS product_name, SUM(o.quantity) AS total_orders,p.restaurant_name,
                p.price AS unit_price, SUM(o.quantity * p.price) AS earnings
            FROM orders o
            JOIN product p ON o.product_ID = p.product_ID
            GROUP BY p.name
            ORDER BY total_orders DESC
            LIMIT 3;
        `);


        // Send the results as JSON response
        res.json({
            rows
        });
    } catch (error) {
        console.error('Error fetching trending products:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/recent-orders', verifyToken, async (req, res) => {
    // Ensure the user is an admin
    if (req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Only admins can access this endpoint' });
    }

    const connection = await db.getConnection();

    try {


        const [rows] = await connection.execute(`
            SELECT 
                o.order_ID,
                p.name AS product_name,
                CONCAT(u.first_name, ' ', u.last_name) AS customer_name,
                u.address AS location,
                o.status,
                o.total_price AS price
            FROM 
                orders o
            JOIN 
                product p ON o.product_ID = p.product_ID
            JOIN 
                user u ON o.user_ID = u.user_ID
            ORDER BY 
                o.purchase_date DESC
            LIMIT 
                5;
        `);

        connection.release();

        if (rows.length === 0) {
            return res.status(404).json({ message: 'No orders found' });
        }

        const recentOrders = rows.map(order => ({
            order_id: order.order_ID,
            product_name: order.product_name,
            customer_name: order.customer_name,
            location: order.location,
            order_status: order.order_status,
            price: order.price
        }));


        res.status(200).json(recentOrders);
    } catch (error) {
        console.error('Error retrieving recent order:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/order-statistics', verifyToken, async (req, res) => {
    try {
        const connection = await db.getConnection();

        const [results] = await connection.execute(`
            SELECT 
                (SELECT COUNT(*) AS tot FROM orders) AS total_orders,
                (SELECT COUNT(*) FROM orders WHERE purchase_date >= DATE_SUB(CURDATE(), INTERVAL 1 WEEK)) AS recent_orders,
                (SELECT COUNT(*) FROM orders WHERE status = 'cancelled') AS cancelled_orders,
                (SELECT COUNT(*) 
                 FROM (
                     SELECT p.product_ID
                     FROM orders o
                     JOIN product p ON o.product_ID = p.product_ID
                     WHERE o.purchase_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
                     GROUP BY o.product_ID
                     HAVING SUM(o.quantity) >= 2
                 ) AS trending_products) AS trending_product_count;
        `);

        connection.release();

        res.json({
            total_orders: results[0].total_orders,
            recentOrders: results[0].recent_orders,
            cancelledOrders: results[0].cancelled_orders,
            trendingProductCount: results[0].trending_product_count
        });
    } catch (error) {
        console.error('Error retrieving statistics:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/total-earnings', verifyToken, async (req, res) => {
    try {
        const connection = await db.getConnection();

        const [results] = await connection.execute(`
            SELECT 
                (SELECT Sum(total_price) AS tot FROM orders) AS total_sales,
                (SELECT SUM(total_price) 
                FROM orders
                WHERE purchase_date = CURDATE() - INTERVAL 1 DAY) AS yesterday_earnings
        `);

        connection.release();

        res.json({
            total_sales: results[0].total_sales,
            yesterday_earnings: results[0].yesterday_earnings
        });
    } catch (error) {
        console.error('Error retrieving statistics:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/restaurants-list', verifyToken, async (req, res) => {

    try {
        const connection = await db.getConnection();
        const [rows] = await connection.execute(`
            SELECT 
                r.name,
                r.description,
                r.image,
                IFNULL(AVG(rt.rating), 0) AS average_rating
            FROM 
                restaurant r
            LEFT JOIN 
                ratings rt ON r.user_ID = rt.restaurant_ID
            GROUP BY 
                r.user_ID;
        `);

        const formattedRows = rows.map(row => ({
            ...row,
            image: row.image ? Buffer.from(row.image).toString('base64') : null
        }));

        res.json(formattedRows);
    } catch (error) {
        console.error('Error fetching restaurant data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/order-list', verifyToken, async (req, res) => {
    try {
        const connection = await db.getConnection();
        const [rows] = await connection.execute(`
            SELECT 
                orders.order_ID,
                products.name AS order_name,
                CONCAT(users.first_name, ' ', users.last_name) AS customer_name,
                users.address AS location,
                orders.status AS order_status,
                orders.total_price AS price
            FROM 
                orders
            JOIN 
                products ON orders.product_ID = products.product_ID
            JOIN 
                users ON orders.user_ID = users.user_ID;
        `);

        //const formattedRows = rows.map(row => ({
        //    ...row,
       //     image: row.image ? Buffer.from(row.image).toString('base64') : null
       // }));

       // res.json(formattedRows);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching orders data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
})

router.get('/restaurant-requests', verifyToken, async (req, res) => {

    try {
        const connection = await db.getConnection();
        const [rows] = await connection.execute(`
            SELECT * FROM restaurant WHERE status = 'pending' GROUP BY user_ID;`);        

        res.json(rows);
    } catch (error) {
        console.error('Error fetching restaurant data:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }

})

module.exports = router;