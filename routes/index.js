// routes/exampleRoute.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ foo: 'bar' }); // 자동으로 { status: 'success', data: { foo: 'bar' } }로 변환됨
});

module.exports = router;
