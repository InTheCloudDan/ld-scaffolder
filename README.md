# LaunchDarkly Flag Scaffolder

-   [Remix Docs](https://remix.run/docs)

## Prerequisites

Need to have `jq` installed. It is used to generated the template dropdown at build time from the `templates` directory.

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