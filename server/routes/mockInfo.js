const express = require('express');
const router = express.Router();

router.get('/info', (req, res) => {
  res.json({ service: 'Sandbox Portal' });
});

module.exports = router;
