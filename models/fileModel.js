const { Schema, model, Types } = require('mongoose')
const { ObjectId } = Types

const fileSchema = new Schema({
	name: { type: String, required: true },
	type: { type: String, required: true },
	accessLink: { type: String },
	size: { type: Number, default: 0 },
	path: { type: String, default: '' },
	user: { type: ObjectId, ref: 'User' },
	parent: { type: ObjectId, ref: 'File' },
	children: [{ type: ObjectId, ref: 'File' }],
	date: { type: Date, default: Date.now() },
})

const File = model('File', fileSchema)

module.exports = File
