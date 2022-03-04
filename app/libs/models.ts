import { Member } from "launchdarkly-api-typescript"

export type FlagTemplateMetadata = {
    title: string
    description: string
    key: string
}

type Availability = {
  client: boolean
  mobile: boolean
}

export type Variation = {
  name?: string
  description?: string
  value: any
}

type DefaultVariation = {
  onVariation: number
  offVariation: number
}

export enum FlagType {
  Boolean = "boolean",
  String = "string",
  Number = "number",
  JSON = "json"
}

type FlagData = {
  name: string
  key: string
  description?: string
  temporary: boolean
  type:FlagType
  availability: Availability
  variations: Variation[]
  defaultVariation: DefaultVariation
}

export type FlagTemplate = {
  metadata: FlagTemplateMetadata,
  flag: FlagData
}

export type User = {
  token: string
  data: Member
}