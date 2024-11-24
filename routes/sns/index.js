const router = require('express').Router();

router.use('/album', require('./album'));
router.use('/auth', require('./auth'));
router.use('/cloi', require('./cloi'));
router.use('/feed', require('./feed'));
router.use('/friend', require('./friend'));
router.use('/group', require('./group'));
router.use('/notify', require('./notify'));
router.use('/profile', require('./profile'));

module.exports = router;