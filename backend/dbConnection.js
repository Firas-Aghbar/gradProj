const { Sequelize, DataTypes } = require('sequelize');
// host: 'localhost', // Database host (e.g., 'localhost' or IP address)
// user: 'root', // Database user
// password: 'rootroot', // Database password
// port: 3306,
// database: 'public', // Database name
// waitForConnections: true,
// connectionLimit: 10,
// queueLimit: 0
const sequelize = new Sequelize('public', 'root', 'rootroot', {
	host: 'localhost',
	dialect: 'mysql',
	port: 3306,
});

const User = sequelize.define(
	'user',
	{
		user_ID: {
			type: DataTypes.INTEGER,
			// field: 'id',
			autoIncrement: true,
			allowNull: false,
			primaryKey: true,
		},
		first_name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		last_name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
		password: {
			type: DataTypes.STRING,
			allowNull: false,
		},
	},
	{
		timestamps: false,
		tableName: 'user',
	}
);

const Users = sequelize.define(
	'users',
	{
		userID: {
			type: DataTypes.INTEGER,
			// field: 'id',
			autoIncrement: true,
			allowNull: false,
			primaryKey: true,
		},
		type: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		email: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
	},
	{
		timestamps: false,
	}
);

const Product = sequelize.define(
	'product',
	{
		product_ID: {
			type: DataTypes.INTEGER,
			// field: 'id',
			autoIncrement: true,
			allowNull: false,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		price: {
			type: DataTypes.DOUBLE,
			allowNull: false,
		},
		description: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		restaurant_name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
	},
	{
		timestamps: false,
        tableName: 'product'
	}
);
//  image, facebook_page, cover_image,,
const Restaurant = sequelize.define(
	'restaurant',
	{
		user_ID: {
			type: DataTypes.INTEGER,
			// field: 'id',
			autoIncrement: true,
			allowNull: false,
			primaryKey: true,
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		email: {
			type: DataTypes.STRING,
			allowNull: false,
		},

		password: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		address: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		phone_no: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},

		average_rating: {
			type: DataTypes.DOUBLE,
			allowNull: false,
		},
		city: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		description: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		facebook_page: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		status: {
			type: DataTypes.STRING,
			allowNull: false,
		},
	},
	{
		timestamps: false,
		tableName: 'restaurant',
	}
);

// order_ID, product_resturant_name, product_ID, user_ID, email, quantity, purchase_date, total_price, status

const Order = sequelize.define(
	'orders',
	{
		order_ID: {
			type: DataTypes.INTEGER,
			// field: 'id',
			autoIncrement: true,
			allowNull: false,
			primaryKey: true,
		},
		product_resturant_name: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		product_ID: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},

		user_ID: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		email: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		quantity: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		purchase_date: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		status: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		total_price: {
			type: DataTypes.DOUBLE,
			allowNull: false,
		},
	},
	{
		timestamps: false,
	}
);

const setUp = async () => {
	try {
		await sequelize.authenticate();
		console.log('Connection has been established successfully.');

		// Sync all models
		await sequelize.sync();
	} catch (error) {
		console.error('Unable to connect to the database:', error);
	} finally {
		// await sequelize.close();
	}
};

module.exports = { User, Users, Restaurant, Product, Order, setUp, sequelize };
