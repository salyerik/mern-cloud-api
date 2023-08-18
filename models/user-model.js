const { Schema, model, Types } = require('mongoose');
const { MB } = require('../config/config');
const { ObjectId } = Types;

const userSchema = new Schema({
	firstName: { type: String, required: true },
	lastName: { type: String, required: true },
	email: { type: String, unique: true, required: true },
	password: { type: String, required: true },
	diskSpace: { type: Number, default: 100 * MB },
	usedSpace: { type: Number, default: 0 },
	avatar: { type: String },
	files: [{ type: ObjectId, ref: 'File' }],
	isMailConfirmed: { type: Boolean, default: false },
	activationLink: { type: String, required: true },
});

const User = model('User', userSchema);

module.exports = User;
