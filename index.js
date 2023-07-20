require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { mongodbUrl, PORT, origin } = require('./config/config');
const app = express();

app.use(cors({ origin, credentials: true }));
app.use(express.json());
app.use('/api', require('./routes/sse-route'));
app.use('/api/auth', require('./routes/auth-route'));
app.use('/api/file', require('./routes/file-route'));

const startServer = () => {
	try {
		mongoose.connect(mongodbUrl, err => {
			if (err) throw err;
			app.listen(PORT || 3030, err => {
				if (err) throw err;
				console.log(`Server is running on Port: ${PORT}`);
			});
		});
	} catch (error) {
		console.log(error);
	}
};

startServer();
