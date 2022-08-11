// We need to import from Remix Auth the type of the strategy verify callback
import { Member } from 'launchdarkly-api-typescript'
import { SessionStorage } from 'remix'
import type { AuthenticateOptions, StrategyVerifyCallback } from 'remix-auth'
// We need to import the OAuth2Strategy, the verify params and the profile interfaces
import type {
    OAuth2Profile,
    OAuth2StrategyVerifyParams,
} from 'remix-auth-oauth2'
import { OAuth2Strategy } from 'remix-auth-oauth2'

// These are the custom options we need from the developer to use the strategy
export interface LaunchDarklyStrategyOptions {
    domain: string
    clientID: string
    clientSecret: string
    callbackURL: string
    scope: string
}

// The LaunchDarklyProfile extends the LaunchDarklyProfile with the extra params and mark
// some of them as required
export interface LaunchDarklyProfile extends OAuth2Profile {
    id: string
    emails: Array<{ value: string }>
    memberData: Member
}

// This interface declare what extra params we will get from LaunchDarkly on the
// verify callback
export interface LaunchDarklyExtraParams
    extends Record<string, string | number> {
    scope: string
    expires_in: number
    token_type: 'Bearer'
}

// And we create our strategy extending the OAuth2Strategy, we also need to
// pass the User as we did on the FormStrategy, we pass the Auth0Profile and the
// extra params
export class LaunchDarklyStrategy<User> extends OAuth2Strategy<
    User,
    LaunchDarklyProfile,
    LaunchDarklyExtraParams
> {
    // The OAuth2Strategy already has a name but we override it to be specific of
    // the service we are using
    name = 'launchdarkly'
    private userInfoURL: string
    scope: string

    // We receive our custom options and our verify callback
    constructor(
        options: LaunchDarklyStrategyOptions,
        verify: StrategyVerifyCallback<
            User,
            OAuth2StrategyVerifyParams<
                LaunchDarklyProfile,
                LaunchDarklyExtraParams
            >
        >
    ) {
        super(
            {
                authorizationURL: `https://${options.domain}/trust/oauth/authorize`,
                tokenURL: `https://${options.domain}/trust/oauth/token`,
                clientID: options.clientID,
                clientSecret: options.clientSecret,
                callbackURL: options.callbackURL,
            },
            verify
        )

        this.userInfoURL = `https://${options.domain}/userinfo`
        this.scope = options.scope || 'openid profile email'
    }

    protected authorizationParams() {
        const urlSearchParams: Record<string, string> = {
            scope: this.scope,
        }

        return new URLSearchParams(urlSearchParams)
    }

    async authenticate(
        request: Request,
        sessionStorage: SessionStorage,
        options: AuthenticateOptions
    ): Promise<User> {
        const user = await super.authenticate(request, sessionStorage, options)
        console.log(user)
        if (user) {
            let session = await sessionStorage.getSession(
                request.headers.get('Cookie')
            )
            session.set('auth_token', user.token)
            session.set('refresh_token', user.refreshToken)
        }

        return user
    }
    // We also override how to use the accessToken to get the profile of the user.
    // Here we fetch the member's profile data
    protected async userProfile(
        accessToken: string
    ): Promise<LaunchDarklyProfile> {
        let response = await fetch(
            `https://app.launchdarkly.com/api/v2/members/me`,
            {
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        )

        let data: Member = await response.json()

        let profile: LaunchDarklyProfile = {
            provider: 'launchdarkly',
            id: data._id,
            emails: [{ value: data.email }],
            memberData: data,
        }
        return profile
    }
}
