const mongoose = require('mongoose')
const { mongodbUrl } = require('../config')

const connectToDB = () => {
	try {
		mongoose.connect(mongodbUrl, () => {
			console.log('MongoDB connected')
		})
	} catch (error) {
		console.log(error.message)
	}
}

module.exports = connectToDB
