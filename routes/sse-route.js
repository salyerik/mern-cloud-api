const Router = require('express');
const sse = require('../services/sse');

const router = Router();

router.get(
	'/stream',
	(req, res, next) => {
		res.flush = () => {};
		next();
	},
	sse.init
);

module.exports = router;
