const Router = require('express')
const multer = require('multer')
const fileController = require('../controllers/fileController')
const auth = require('../middlewares/authMiddleware')

const upload = multer({ storage: multer.memoryStorage() })
const router = new Router()

router.post('', auth, fileController.createDir)
router.post('/upload', [auth, upload.single('file')], fileController.uploadFile)
router.get('', auth, fileController.getFiles)
router.get('/existCheck', auth, fileController.existCheck)
router.get('/download', auth, fileController.downloadFile)
router.delete('', auth, fileController.deleteFile)
router.get('/search', auth, fileController.searchFiles)
router.post('/avatar', [auth, upload.single('file')], fileController.uploadAvatar)
router.delete('/avatar', auth, fileController.deleteAvatar)

module.exports = router
