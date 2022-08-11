import { Member } from 'launchdarkly-api-typescript'
import { createCookieSessionStorage, redirect, Session } from 'remix'
import { Authenticator } from 'remix-auth'
import { LaunchDarklyStrategy } from './LaunchDarklyStrategy'
import { User } from './models'

export const sessionStorage = createCookieSessionStorage({
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

const httpProtocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'

authenticator.use(
    new LaunchDarklyStrategy(
        {
            domain: 'app.launchdarkly.com',
            clientID: process.env.CLIENT_ID!,
            clientSecret: process.env.CLIENT_SECRET!,
            callbackURL: `https://${process.env.DOMAIN}/auth/callback`,
            scope: 'writer',
        },

        async ({
            accessToken,
            refreshToken,
            extraParams,
            profile,
            context,
        }) => {
            console.log('HERE')
            console.log(accessToken, refreshToken)
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
        refreshToken: refreshToken,
        data: (await res.json()) as Member,
    }

    return user
}

export async function LDAuthedRequest(
    session: Session,
    url: string,
    init: RequestInit
) {
    let { token, refreshToken, ...rest } = session.get(authenticator.sessionKey)
    console.log('This is the rest!!')
    console.log(rest)
    console.log('END')
    const req = new Request(url, {
        ...init,
        headers: { ...init.headers, Authorization: `Bearer ${token}` },
    })
    console.log(JSON.stringify(req))
    console.log(req)
    console.log(req.headers)
    let response = await fetch(req)
    console.log(`Response: ${response.status}`)
    if (response.status === 401) {
        console.log(!refreshToken)
        if (!refreshToken) {
            return redirect('/login')
        }

        const body = new FormData()
        body.append('token_type_hint', 'refresh_token')
        let newTokenResponse = await fetch(
            `https://app.launchdarkly.com/trust/oauth/token`,
            {
                headers: { Authorization: `Bearer ${rest['refresh_token']}` },
                method: 'POST',
                body,
            }
        )
        console.log(newTokenResponse.status)
        console.log('Test')
        let newToken = await newTokenResponse.json()
        console.log(newToken)
        session.set(authenticator.sessionKey, { ...rest, ...newToken })
        return LDAuthedRequest(session, url, init)
    }
    return response
}
