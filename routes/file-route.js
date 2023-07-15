const Router = require('express');
const multer = require('multer');
const fileController = require('../controllers/file-controller');
const auth = require('../middlewares/auth-mw');

const upload = multer({ storage: multer.memoryStorage() });
const router = new Router();

router.get('', auth, fileController.getFiles);
router.post('', auth, fileController.createDir);
router.delete('', auth, fileController.deleteFile);
router.get('/exist-check', auth, fileController.existCheck);
router.post(
	'/upload',
	[auth, upload.single('file')],
	fileController.uploadFile,
);
router.get('/download', auth, fileController.downloadFile);
router.get('/get-url', auth, fileController.getSignedFileUrl);
router.get('/search', auth, fileController.searchFiles);
router.post(
	'/avatar',
	[auth, upload.single('file')],
	fileController.uploadAvatar,
);
router.delete('/avatar', auth, fileController.deleteAvatar);

module.exports = router;
