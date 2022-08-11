import { FeatureFlagBody } from 'launchdarkly-api-typescript'
import { useCallback, useState } from 'react'
import { Form } from 'remix'
import { FlagTemplate, FlagType, User, Variation } from '~/libs/models'

type FlagTemplateProps = {
    flag: FlagTemplate
    projectKey?: string
    user: User
}

function checkInput(flag: FlagType) {
    switch (flag) {
        case 'number':
            return 'number'
        case 'boolean':
            return 'text'
        case 'json':
            return 'textarea'
        case 'string':
            return 'text'
    }
}

function forceFlagType(flag: string, value: unknown) {
    switch (flag) {
        case 'number':
            return Number(value)
        case 'boolean':
            return value === 'true'
        //case "json":
        //       return "textarea"
        case 'string':
            return value
    }
}

function checkBoolean(flag: FlagType) {
    if (flag === 'boolean') {
        return true
    }
    return false
}

export default function FlagTemplateComponent(props: FlagTemplateProps) {
    const metadata = props.flag.metadata
    const flagData = props.flag.flag
    const user = props.user
    const projectKey = props.projectKey

    async function postFeatureFlag(user: User, flag: FeatureFlagBody) {
        const url = `https://app.launchdarkly.com/api/v2/flags/${projectKey}`
        const newFlag = await fetch(
            `https://app.launchdarkly.com/api/v2/flags/${projectKey}`,
            {
                method: 'post',
                headers: new Headers({
                    Authorization: `Bearer ${user.token}`,
                    'Content-Type': 'application/json',
                }),
                body: JSON.stringify(flag),
            }
        )
        return newFlag
    }

    function handleSubmit(event) {
        event.preventDefault()
        const data = new FormData(event.target)
        const newFlag: FeatureFlagBody = {
            name: data.get('name')!.toString(),
            key: data.get('key')!.toString(),
        }
        if (data.get('description') !== '') {
            newFlag['description'] = data.get('description')!.toString()
        }
        newFlag['clientSideAvailability'] = {
            usingEnvironmentId:
                data.get('usingEnvironmentId')?.toString() === 'on',
            usingMobileKey: data.get('usingMobileKey')?.toString() === 'on',
        }
        newFlag['defaults'] = {
            onVariation: Number(data.get('onVariation')!.toString()),
            offVariation: Number(data.get('offVariation')!.toString()),
        }

        const value = Object.fromEntries(data.entries())
        const variationCount = Number(data.get('variationCount')) - 1
        const variations = []
        for (let i = 0; i <= variationCount; i++) {
            const variation = {
                name: data.get(`variations${i}.name`),
                description: data.get(`variations${i}.description`),
                value: forceFlagType(
                    data.get('flagType')!.toString(),
                    data.get(`variations${i}.value`)
                ),
            }
            variations.push(
                Object.fromEntries(
                    Object.entries(variation).filter(([_, v]) => {
                        return v != null && v != ''
                    })
                )
            )
        }
        newFlag['variations'] = variations
        postFeatureFlag(user, newFlag)
    }
    return (
        <div>
            <div>
                <h1>{metadata.title}</h1>
                <pre>{metadata.description}</pre>
            </div>
            <div>
                <Form method="post" onSubmit={handleSubmit}>
                    <p>
                        <label>
                            Name:{' '}
                            <input
                                name="name"
                                type="text"
                                defaultValue={flagData.name}
                            />
                        </label>
                    </p>
                    <p>
                        <label>
                            Key:{' '}
                            <input
                                name="key"
                                type="text"
                                defaultValue={flagData.key}
                            />
                        </label>
                    </p>
                    <p>
                        <label>
                            Description:{' '}
                            <input
                                name="description"
                                type="text"
                                defaultValue={flagData.description}
                            />
                        </label>
                    </p>
                    <p>
                        <label>
                            Mark as Permanent:{' '}
                            <input
                                name="temporary"
                                type="checkbox"
                                defaultChecked={!flagData.temporary}
                            />
                        </label>
                    </p>
                    <fieldset>
                        <legend>Choose Flag Availability</legend>
                        <label>
                            Client-Side
                            <input
                                type="checkbox"
                                id="usingEnvironmentId"
                                name="usingEnvironmentId"
                                defaultChecked={flagData.availability.client}
                            />
                        </label>

                        <label>
                            Mobile
                            <input
                                type="checkbox"
                                id="usingMobileKey"
                                name="usingMobileKey"
                                defaultChecked={flagData.availability.mobile}
                            />
                        </label>
                    </fieldset>

                    <fieldset>
                        <legend>Configure Default On/Off Variation</legend>
                        <label>
                            On Variation:
                            <select
                                name="onVariation"
                                id="variation-on"
                                defaultValue={
                                    flagData.defaultVariation.onVariation
                                }
                            >
                                {flagData.variations.map(
                                    (item: Variation, idx: number) => (
                                        <option
                                            key={item.value}
                                            label={
                                                item.name
                                                    ? item.name
                                                    : JSON.stringify(item.value)
                                            }
                                            value={idx}
                                        />
                                    )
                                )}
                            </select>
                        </label>
                        <br />
                        <label>
                            Off Variation:
                            <select
                                name="offVariation"
                                id="variation-off"
                                defaultValue={
                                    flagData.defaultVariation.offVariation
                                }
                            >
                                {flagData.variations.map(
                                    (item: Variation, idx: number) => (
                                        <option
                                            key={item.value}
                                            label={
                                                item.name
                                                    ? item.name
                                                    : JSON.stringify(item.value)
                                            }
                                            value={idx}
                                        />
                                    )
                                )}
                            </select>
                        </label>
                    </fieldset>

                    <fieldset>
                        <legend>Variations</legend>
                        {flagData.variations.map(
                            (item: Variation, idx: number) => (
                                <>
                                    <label>
                                        Name:{' '}
                                        <input
                                            name={`variations${idx}.name`}
                                            type="text"
                                            defaultValue={item.name}
                                        />
                                    </label>
                                    <label>
                                        Description:{' '}
                                        <input
                                            name={`variations${idx}.description`}
                                            type="text"
                                            defaultValue={item.description}
                                        />
                                    </label>
                                    <label>
                                        Value:{' '}
                                        <input
                                            name={`variations${idx}.value`}
                                            type={checkInput(flagData.type)}
                                            defaultValue={item.value}
                                            readOnly={checkBoolean(
                                                flagData.type
                                            )}
                                        />
                                    </label>
                                    <br />
                                </>
                            )
                        )}
                    </fieldset>
                    <input
                        type="hidden"
                        name="variationCount"
                        id="variationCount"
                        value={flagData.variations.length}
                    />
                    <input
                        type="hidden"
                        name="flagType"
                        id="flagType"
                        value={flagData.type}
                    />
                    <button>Create Flag</button>
                </Form>
            </div>
        </div>
    )
}
