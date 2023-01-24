const filePathMiddleware = path => {
	return (req, res, next) => {
		req.globalFilePath = path
		next()
	}
}

module.exports = filePathMiddleware
