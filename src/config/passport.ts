import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Prisma } from '@prisma/client';
import { prisma } from './database.js';
import { env } from './env.js';

// Google Strategy
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${env.OAUTH_CALLBACK_BASE_URL}/api/auth/google/callback`,
        scope: ['profile', 'email'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) return done(new Error('No email from Google'));

          // Find by googleId or email
          let user = await prisma.user.findFirst({
            where: { OR: [{ googleId: profile.id }, { email }] },
          });

          if (user) {
            // Link Google account if not already linked
            if (!user.googleId) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: {
                  googleId: profile.id,
                  avatar: user.avatar ?? profile.photos?.[0]?.value,
                  emailVerified: true,
                  status: 'ACTIVE',
                },
              });
            }
          } else {
            // Create new user
            user = await prisma.user.create({
              data: {
                name: profile.displayName,
                email,
                googleId: profile.id,
                avatar: profile.photos?.[0]?.value,
                role: 'CITIZEN',
                status: 'ACTIVE',
                emailVerified: true,
              },
            });
          }

          done(null, user);
        } catch (err) {
          done(err as Error);
        }
      }
    )
  );
}

// Facebook Strategy
if (env.FACEBOOK_APP_ID && env.FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: env.FACEBOOK_APP_ID,
        clientSecret: env.FACEBOOK_APP_SECRET,
        callbackURL: `${env.OAUTH_CALLBACK_BASE_URL}/api/auth/facebook/callback`,
        profileFields: ['id', 'displayName', 'emails', 'photos'],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          // Facebook may not return email; handle gracefully
          const lookupConditions: Prisma.UserWhereInput[] = [{ facebookId: profile.id }];
          if (email) lookupConditions.push({ email });

          let user = await prisma.user.findFirst({
            where: { OR: lookupConditions },
          });

          if (user) {
            if (!user.facebookId) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: {
                  facebookId: profile.id,
                  avatar: user.avatar ?? profile.photos?.[0]?.value,
                  emailVerified: true,
                  status: 'ACTIVE',
                },
              });
            }
          } else {
            user = await prisma.user.create({
              data: {
                name: profile.displayName,
                email: email ?? `fb-${profile.id}@placeholder.local`,
                facebookId: profile.id,
                avatar: profile.photos?.[0]?.value,
                role: 'CITIZEN',
                status: 'ACTIVE',
                emailVerified: true,
              },
            });
          }

          done(null, user);
        } catch (err) {
          done(err as Error);
        }
      }
    )
  );
}

export default passport;
