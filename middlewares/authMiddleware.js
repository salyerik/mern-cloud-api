const jwt = require('jsonwebtoken')

const auth = (req, res, next) => {
	if (req.method === 'OPTIONS') {
		next()
	}
	try {
		const token = req.headers.authorization.split(' ')[1]
		if (!token) {
			return res.status(401).json({ message: 'Auth Middleware error' })
		}
		req.user = jwt.verify(token, process.env.SECRET_KEY)
		next()
	} catch (error) {
		return res.status(401).json({ message: 'Auth Middleware error' })
	}
}

module.exports = auth
