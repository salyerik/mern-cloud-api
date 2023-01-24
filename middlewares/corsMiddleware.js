const { origin } = require('./../config')

const cors = (req, res, next) => {
	res.header('Access-Control-Allow-Origin', origin)
	res.header('Access-Control-Allow-Credentials', true)
	res.header('Access-Control-Allow-Methods', 'GET, PUT, PATCH, POST, DELETE')
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
	res.header('Content-Type', 'text/event-stream')
	next()
}

module.exports = cors
