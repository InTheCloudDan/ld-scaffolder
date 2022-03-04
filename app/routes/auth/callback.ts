// app/routes/auth/github/callback.tsx
import { LoaderFunction } from 'remix'
import { authenticator } from '~/libs/auth.server'

export let loader: LoaderFunction = ({ request }) => {
    return authenticator.authenticate('launchdarkly', request, {
        successRedirect: '/',
        failureRedirect: '/login',
    })
}
