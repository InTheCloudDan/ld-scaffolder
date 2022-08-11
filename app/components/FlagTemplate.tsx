import { FeatureFlagBody } from 'launchdarkly-api-typescript'
import { useEffect, useState } from 'react'
import { Form } from 'remix'
import { FlagTemplate, FlagType, User, Variation } from '~/libs/models'

type FlagTemplateProps = {
    flag: string
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
    const flagData = props.flag
    const user = props.user
    const projectKey = props.projectKey
    const [selectedFlag, setFlag] = useState<FlagTemplate | undefined>()

    useEffect(() => {
        getFlag(flagData)
        // this hook will get called everytime when myArr has changed
        // perform some action which will get fired everytime when myArr gets updated
    }, [flagData])

    const getFlag = async (fileName: string) => {
        const url = `/templates/${fileName}`
        const flag = await fetch(url)
        const flagData = await flag.json()
        console.log(flagData)
        setFlag(flagData)
    }

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

    function handleSubmit(event: any) {
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
                <h1>{selectedFlag?.metadata.title}</h1>
                <pre>{selectedFlag?.metadata.description}</pre>
            </div>
            <div>
                <Form method="post" onSubmit={handleSubmit}>
                    <p>
                        <label>
                            Name:{' '}
                            <input
                                name="name"
                                type="text"
                                defaultValue={selectedFlag?.flag.name}
                            />
                        </label>
                    </p>
                    <p>
                        <label>
                            Key:{' '}
                            <input
                                name="key"
                                type="text"
                                defaultValue={selectedFlag?.flag.key}
                            />
                        </label>
                    </p>
                    <p>
                        <label>
                            Description:{' '}
                            <input
                                name="description"
                                type="text"
                                defaultValue={selectedFlag?.flag.description}
                            />
                        </label>
                    </p>
                    <p>
                        <label>
                            Mark as Permanent:{' '}
                            <input
                                name="temporary"
                                type="checkbox"
                                defaultChecked={!selectedFlag?.flag.temporary}
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
                                defaultChecked={
                                    selectedFlag?.flag.availability.client
                                }
                            />
                        </label>

                        <label>
                            Mobile
                            <input
                                type="checkbox"
                                id="usingMobileKey"
                                name="usingMobileKey"
                                defaultChecked={
                                    selectedFlag?.flag.availability.mobile
                                }
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
                                    selectedFlag?.flag.defaultVariation
                                        .onVariation
                                }
                            >
                                {selectedFlag?.flag.variations.map(
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
                                    selectedFlag?.flag.defaultVariation
                                        .offVariation
                                }
                            >
                                {selectedFlag?.flag.variations.map(
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
                        {selectedFlag?.flag.variations.map(
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
                                            type={checkInput(
                                                selectedFlag?.flag.type
                                            )}
                                            defaultValue={item.value}
                                            readOnly={checkBoolean(
                                                selectedFlag?.flag.type
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
                        value={selectedFlag?.flag.variations.length}
                    />
                    <input
                        type="hidden"
                        name="flagType"
                        id="flagType"
                        value={selectedFlag?.flag.type}
                    />
                    <button>Create Flag</button>
                </Form>
            </div>
        </div>
    )
}
