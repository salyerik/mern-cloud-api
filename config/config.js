const { platform } = require('os');

module.exports = {
	PORT: process.env.PORT,
	origin:
		process.env.NODE_ENV === 'development'
			? process.env.LOCAL_APP_URL
			: process.env.REMOTE_APP_URL,
	mongodbUrl:
		process.env.NODE_ENV === 'development'
			? process.env.MONGO_DB_LOCAL_URL
			: process.env.MONGO_DB_REMOTE_URL,
	apiUrl:
		process.env.NODE_ENV === 'development'
			? process.env.LOCAL_API_URL
			: process.env.REMOTE_API_URL,
	MB: platform() === 'darwin' ? 1024 * 1024 : 1024 * 1024,
};
