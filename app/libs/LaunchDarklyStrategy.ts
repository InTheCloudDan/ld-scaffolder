// We need to import from Remix Auth the type of the strategy verify callback
import type { StrategyVerifyCallback } from 'remix-auth'
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

// This interface declare what extra params we will get from LaunchDarkly on the
// verify callback
export interface LaunchDarklyExtraParams
    extends Record<string, string | number> {
    scope: string
}

// And we create our strategy extending the OAuth2Strategy, we also need to
// pass the User as we did on the FormStrategy, we pass the Auth0Profile and the
// extra params
export class LaunchDarklyStrategy<User> extends OAuth2Strategy<
    User,
    OAuth2Profile,
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
        // Here we type the verify callback as a StrategyVerifyCallback receiving
        // the User type and the OAuth2StrategyVerifyParams with the Auth0Profile
        // and the Auth0ExtraParams
        // This way, when using the strategy the verify function will receive as
        // params an object with accessToken, refreshToken, extraParams and profile.
        // The latest two matching the types of Auth0Profile and Auth0ExtraParams.
        verify: StrategyVerifyCallback<
            User,
            OAuth2StrategyVerifyParams<OAuth2Profile, LaunchDarklyExtraParams>
        >
    ) {
        // And we pass the options to the super constructor using our own options
        // to generate them, this was we can ask less configuration to the developer
        // using our strategy
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

    // We override the protected authorizationParams method to return a new
    // URLSearchParams with custom params we want to send to the authorizationURL.
    // Here we add the scope so Auth0 can use it, you can pass any extra param
    // you need to send to the authorizationURL here base on your provider.
    protected authorizationParams() {
        const urlSearchParams: Record<string, string> = {
            scope: this.scope,
        }

        return new URLSearchParams(urlSearchParams)
    }

    // We also override how to use the accessToken to get the profile of the user.
    // Here we fetch a Auth0 specific URL, get the profile data, and build the
    // object based on the Auth0Profile interface.
    // protected async userProfile(accessToken: string): Promise<Auth0Profile> {
    //   let response = await fetch(this.userInfoURL, {
    //     headers: { Authorization: `Bearer ${accessToken}` },
    //   });

    //   let data: Auth0Profile["_json"] = await response.json();

    //   let profile: Auth0Profile = {
    //     provider: "auth0",
    //     displayName: data.name,
    //     id: data.sub,
    //     name: {
    //       familyName: data.family_name,
    //       givenName: data.given_name,
    //       middleName: data.middle_name,
    //     },
    //     emails: [{ value: data.email }],
    //     photos: [{ value: data.picture }],
    //     _json: data,
    //   };

    //   return profile;
    // }
}
