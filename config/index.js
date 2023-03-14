const { platform } = require('os')

module.exports = {
	PORT: process.env.PORT,
	origin:
		process.env.NODE_ENV === '1production'
			? process.env.REMOTE_APP_URL
			: process.env.LOCAL_APP_URL,
	mongodbUrl:
		process.env.NODE_ENV === 'production'
			? process.env.MONGO_DB_REMOTE_URL
			: process.env.MONGO_DB_LOCAL_URL,
	MB: platform() === 'darwin' ? 1000 * 1000 : 1024 * 1024
}
