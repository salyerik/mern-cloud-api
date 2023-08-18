const nodemailer = require('nodemailer');
const { apiUrl } = require('../config/config');

class MailService {
	constructor() {
		this.transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			post: process.env.SMTP_PORT,
			secure: false,
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASSWORD,
			},
		});
	}
	async sendActivationMail(to, link) {
		await this.transporter.sendMail({
			from: process.env.SMTP_USER,
			to,
			subject: `Account activation on ${process.env.REMOTE_APP_URL}/mern-cloud`,
			html: `
					<div>
						<h1>Email confirmation on Saly's Cloud Service</h1>
						<a href='${apiUrl}/auth/activate/${link}'>
							Click to confirm your e-mail
						</a>
					</div>
				`,
		});
	}
}

module.exports = new MailService();
