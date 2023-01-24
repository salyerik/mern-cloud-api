require('dotenv').config()
const express = require('express')
const cors = require('./middlewares/corsMiddleware')
const { PORT } = require('./config')
const app = express()

app.use(cors)
app.use(express.json())
app.use(require('./routes/sseRoutes'))
app.use('/auth', require('./routes/authRoutes'))
app.use('/file', require('./routes/fileRoutes'))

app.listen(PORT, () => {
	console.log('Server is running on Port: ' + PORT)
	require('./db')()
})
