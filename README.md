# Welcome to Remix!

-   [Remix Docs](https://remix.run/docs)

## Development

You will need an OAuth client/secret pair for LaunchDarkly. Copy the `.env.sample` file as shown below and update values.

```sh
cp .env.sample .env
```

From your terminal:

```sh
npm run dev
```
## Deployment

First, build your app for production:

```sh
npm run build
```

Then run the app in production mode:

```sh
npm start
```