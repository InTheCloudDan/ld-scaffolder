import { LoaderFunction, redirect, Session, useLoaderData } from 'remix'
import FlagTemplateJson from '~/flagSelect.json'
import type { FlagTemplate, FlagTemplateMetadata, User } from '~/libs/models'
import { useEffect, useState } from 'react'
import FlagTemplateComponent from '~/components/FlagTemplate'
import {
    authenticator,
    sessionStorage,
    LDAuthedRequest,
} from '~/libs/auth.server'
import { Project, Projects } from 'launchdarkly-api-typescript'
import ProjectInfo from '~/components/ProjectInfo'

async function getProjects(user: User, session: Session) {
    const projects = (await LDAuthedRequest(
        session,
        `https://app.launchdarkly.com/api/v2/projects`,
        {
            headers: new Headers({
                Authorization: `Bearer ${user.token}`,
                'Content-Type': 'application/json',
            }),
            redirect: 'follow',
        }
    )) as Response
    if (!projects) {
        redirect('/login')
    }
    const projectData = await projects
    const projectText = await projectData.json()
    return projectText
}

export let loader: LoaderFunction = async ({ request }) => {
    let user = await authenticator.authenticate('launchdarkly', request, {
        failureRedirect: '/login',
        throwOnError: true,
    })
    const session = await sessionStorage.getSession(
        request.headers.get('Cookie')
    )

    const projects = await getProjects(user, session)

    const url = new URL(request.url)
    const flagQuery = url.searchParams.get('flags')
    const environmentQuery = url.searchParams.get('environments')

    let fqArr
    if (flagQuery && flagQuery?.length > 0) {
        fqArr = flagQuery.split(',')
    }

    let envArr
    if (environmentQuery && environmentQuery?.length > 0) {
        envArr = environmentQuery.split(',')
    }

    return {
        projects: projects as Projects,
        user: user as User,
        flagQuery: fqArr,
        envQuery: envArr,
    }
}

export default function Index() {
    const [selectedFlag, setFlag] = useState('')
    const [selectedProject, setProject] = useState('')
    const { projects, user, flagQuery, envQuery } = useLoaderData()

    // useEffect(() => {
    //     console.log
    //     // this hook will get called everytime when myArr has changed
    //     // perform some action which will get fired everytime when myArr gets updated
    // }, [selectedFlag])

    // async function getFlag(fileName: string) {
    //     const url = `/templates/${fileName}`
    //     const flag = await fetch(url)
    //     const flagData = await flag.json()
    //     setFlag(flagData)
    //     return flagData as FlagTemplate
    // }

    function updateProject(e: React.ChangeEvent<HTMLSelectElement>) {
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
                            onChange={(e) => updateProject(e)}
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
                        onChange={(e) => setFlag(e.target.value)}
                    >
                        {FlagTemplateJson.map((nav: FlagTemplateMetadata) => {
                            if (flagQuery) {
                                const flagList: Array<any> = []
                                flagQuery.forEach((query: string) => {
                                    if (query == nav.key) {
                                        flagList.push(
                                            <option
                                                key={nav.title}
                                                label={nav.title}
                                                value={nav.key}
                                            />
                                        )
                                    }
                                })
                                return flagList
                            } else {
                                return (
                                    <option
                                        key={nav.title}
                                        label={nav.title}
                                        value={nav.key}
                                    />
                                )
                            }
                        })}
                    </select>
                </label>
            </p>
            {selectedProject && (
                <ProjectInfo
                    user={user}
                    project={selectedProject}
                    envFilter={envQuery}
                />
            )}

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
