require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
// const cors = require('./middlewares/cors-mw');
const { mongodbUrl, PORT } = require('./config/config');
const { origin } = require('./config/config');

app.use(
	cors({ origin, credentials: true, exposedHeaders: ['Content-Disposition'] }),
);
// app.use(cors());
app.use(express.json());
app.use('/api', require('./routes/sse-route'));
app.use('/api/auth', require('./routes/auth-route'));
app.use('/api/file', require('./routes/file-route'));

const startServer = async () => {
	try {
		await mongoose.connect(mongodbUrl);
		await app.listen(PORT);
		console.log('Server is running on Port: ' + PORT);
	} catch (error) {
		console.log(error.message);
	}
};

startServer();
