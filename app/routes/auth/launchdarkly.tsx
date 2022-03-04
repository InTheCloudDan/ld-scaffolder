import { ActionFunction, LoaderFunction, redirect } from "remix";
import { authenticator } from "~/libs/auth.server";

export let loader: LoaderFunction = () => redirect("/login");

export let action: ActionFunction = ({ request }) => {
  return authenticator.authenticate("launchdarkly", request);
};