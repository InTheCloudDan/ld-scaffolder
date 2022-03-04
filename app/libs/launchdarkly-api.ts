import { FeatureFlagsApi, Configuration, ProjectsApi } from "launchdarkly-api-typescript";

export default function GetFeatureApi(token: string) {
  const config = new Configuration({apiKey: `Bearer token`});
  return new FeatureFlagsApi(config);
}

export function GetProjectsApi(token: string) {
  const config = new Configuration({apiKey: token});
  return new ProjectsApi(config);
}