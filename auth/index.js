const express = require('express');
const passport = require('passport');
const router = express.Router();

router.get('/auth/loggedin', (req, res, next) => {
  if(req.user) res.json(req.user)
  else res.json('no body found')
})

router.post('/auth/google/token', 
  passport.authenticate('google-token'),
    (req, res, next) => {
      res.json(req.user)
    }
)

module.exports = router
