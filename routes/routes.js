const router = require('express').Router();

router.get('/users-list', async (req, res) => {
    res.send('response');
});

module.exports = router;