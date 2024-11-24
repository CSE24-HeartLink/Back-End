const router = require('express').Router();

router.use('/album', require('./albumRoutes'));
router.use('/auth', require('./authRoutes'));
router.use('/cloi', require('./cloiRoutes'));
router.use('/feed', require('./feedRoutes'));
router.use('/friend', require('./friendRoutes'));
router.use('/group', require('./groupRoutes'));
router.use('/notify', require('./notifyRoutes'));
router.use('/profile', require('./profileRoutes'));

module.exports = router;