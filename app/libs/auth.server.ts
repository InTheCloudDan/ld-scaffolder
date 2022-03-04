import { Member, UsersApiAxiosParamCreator } from 'launchdarkly-api-typescript'
import { createCookieSessionStorage } from 'remix'
import { Authenticator } from 'remix-auth'
import { OAuth2Strategy } from 'remix-auth-oauth2'
import { LaunchDarklyStrategy } from './LaunchDarklyStrategy'
import { User } from './models'

export let sessionStorage = createCookieSessionStorage({
    cookie: {
        name: '_session', // use any name you want here
        sameSite: 'lax', // this helps with CSRF
        path: '/', // remember to add this so the cookie will work in all routes
        httpOnly: true, // for security reasons, make this cookie http only
        secrets: ['s3cr3t'], // replace this with an actual secret
        secure: process.env.NODE_ENV === 'production', // enable this in prod only
    },
})

export let authenticator = new Authenticator<User>(sessionStorage, {
    throwOnError: true,
})

authenticator.use(
    new LaunchDarklyStrategy(
        {
            domain: 'app.launchdarkly.com',
            clientID: process.env.CLIENT_ID!,
            clientSecret: process.env.CLIENT_SECRET!,
            callbackURL: 'http://localhost:3000/auth/callback',
            scope: 'writer',
        },

        async ({
            accessToken,
            refreshToken,
            extraParams,
            profile,
            context,
        }) => {
            // here you can use the params above to get the user and return it
            // what you do inside this and how you find the user is up to you
            return await getUser(accessToken, refreshToken)
        }
    ),
    // this is optional, but if you setup more than one OAuth2 instance you will
    // need to set a custom name to each one
    'launchdarkly'
)

async function getUser(accessToken: string, refreshToken: string) {
    const res = await fetch('https://app.launchdarkly.com/api/v2/members/me', {
        headers: new Headers({
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        }),
    })

    const user: User = {
        token: accessToken,
        data: (await res.json()) as Member,
    }

    console.log(JSON.stringify(user))
    return user
}
