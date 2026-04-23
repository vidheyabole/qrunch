const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Owner          = require('../models/Owner');
const generateToken  = require('../utils/generateToken');

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  process.env.GOOGLE_CALLBACK_URL
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const email  = profile.emails?.[0]?.value;
    const avatar = profile.photos?.[0]?.value;

    if (!email) return done(new Error('No email from Google'), null);

    // Check if owner already exists with this Google ID
    let owner = await Owner.findOne({ googleId: profile.id });
    if (owner) return done(null, owner);

    // Check if owner exists with same email (link accounts)
    owner = await Owner.findOne({ email });
    if (owner) {
      owner.googleId  = profile.id;
      owner.avatar    = avatar;
      owner.authMethod = 'both';
      await owner.save();
      return done(null, owner);
    }

    // Create new owner via Google
    owner = await Owner.create({
      ownerName:   profile.displayName || email.split('@')[0],
      email,
      password:    'GOOGLE_AUTH_NO_PASSWORD',
      region:      'india', // default — can be updated in profile
      googleId:    profile.id,
      avatar,
      authMethod:  'google',
      subscriptionActive: true
    });

    done(null, owner);
  } catch (err) {
    done(err, null);
  }
}));

passport.serializeUser((owner, done) => done(null, owner._id));
passport.deserializeUser(async (id, done) => {
  try {
    const owner = await Owner.findById(id);
    done(null, owner);
  } catch (err) { done(err, null); }
});

module.exports = passport;