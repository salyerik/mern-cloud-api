const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const jwt = require('jsonwebtoken');

class CommonService {
	async response(user) {
		let avatar = null;
		if (user.avatar) {
			const command = new GetObjectCommand({
				Bucket,
				Key: user._id + '/avatar/' + user.avatar,
			});
			avatar = await getSignedUrl(s3, command, { expiresIn: 600 });
		}
		return {
			token: jwt.sign({ id: user._id }, process.env.SECRET_KEY, {
				expiresIn: '28hr',
			}),
			user: {
				firstName: user.firstName,
				lastName: user.lastName,
				isMailConfirmed: user.isMailConfirmed,
				avatar,
			},
		};
	}
}

module.exports = new CommonService();
