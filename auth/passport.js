const passport = require('passport');
const GoogleTokenStrategy = require('passport-google-token').Strategy
const { prisma } = require('../schema/resolvers')

passport.use(new GoogleTokenStrategy({
  clientID: process.env.googleClientId,
  clientSecret: process.env.googleClientSecret
},
  async function(accessToken, refreshToken, profile, done) {
    const email = profile._json.email
    const exists = await prisma.user.findOne({
      where: { email }
    })

    if(exists) return done(null, exists)

    const create = await prisma.user.create({
      data: { email, username: profile.displayName }
    })

    return done(null, create)
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(async function(id, done) {
  const user = await prisma.user.findOne({
    where: { id }
  })
  done(null, user)
});

module.exports = passport