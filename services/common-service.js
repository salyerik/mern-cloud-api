const { GetObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const jwt = require('jsonwebtoken');
const s3 = new S3Client();

class CommonService {
	async response(user) {
		let avatar = null;
		if (user.avatar) {
			const command = new GetObjectCommand({
				Bucket: process.env.AWS_BUCKET,
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
