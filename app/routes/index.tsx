import { LoaderFunction, useLoaderData } from 'remix'
import NavData from '~/nav/nav'
import type { FlagTemplate, FlagTemplateMetadata, User } from '~/libs/models'
import { useState } from 'react'
import FlagTemplateComponent from '~/components/FlagTemplate'
import { authenticator } from '~/libs/auth.server'
import { Project, Projects } from 'launchdarkly-api-typescript'
import AppHeader, { SimpleAppHeader } from '~/components/AppHeader'
import { Topbar } from '~/components/TopBar'

async function getProjects(user: User) {
    const projects = await fetch(
        `https://app.launchdarkly.com/api/v2/projects`,
        {
            headers: new Headers({
                Authorization: `Bearer ${user.token}`,
                'Content-Type': 'application/json',
            }),
        }
    )
    return projects.json()
}

export let loader: LoaderFunction = async ({ request }) => {
    let user = await authenticator.authenticate('launchdarkly', request, {
        failureRedirect: '/login',
        throwOnError: true,
    })

    const projects = await getProjects(user)
    return [projects, user]
}

export default function Index() {
    const [selectedFlag, setFlag] = useState()
    const [selectedProject, setProject] = useState()
    const [projects, user] = useLoaderData()
    async function getFlag(fileName: string) {
        const url = `http://localhost:3000/templates/${fileName}`
        const flag = await fetch(url)
        const flagData = await flag.json()
        setFlag(flagData)
        return flagData as FlagTemplate
    }

    function updateProject(e) {
        setProject(e.target.value)
    }

    return (
        <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.4' }}>
            <h1>LaunchDarkly Scaffolder</h1>
            <p>
                {projects && (
                    <label>
                        Select Project:
                        <br />
                        <select
                            name="project-key"
                            id="project-key-select"
                            onChange={updateProject}
                        >
                            {projects.items.map((item: Project) => (
                                <option
                                    key={item.key}
                                    label={item.name}
                                    value={item.key}
                                />
                            ))}
                        </select>
                    </label>
                )}
                <br />
                <label>
                    Select Template:
                    <br />
                    <select
                        name="Select Template"
                        id="template-select"
                        onChange={(e) => getFlag(e.target.value)}
                    >
                        {NavData.map((nav: FlagTemplateMetadata) => (
                            <option
                                key={nav.title}
                                label={nav.title}
                                value={nav.key}
                            />
                        ))}
                    </select>
                </label>
            </p>
            {selectedFlag && (
                <FlagTemplateComponent
                    user={user}
                    flag={selectedFlag}
                    projectKey={selectedProject}
                />
            )}
        </div>
    )
}
