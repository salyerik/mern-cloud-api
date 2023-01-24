const Router = require('express')
const sse = require('./../sse')

const router = Router()

router.get('/stream', sse.init)

module.exports = router
