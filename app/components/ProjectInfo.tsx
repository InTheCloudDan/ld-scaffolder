import { Project } from 'launchdarkly-api-typescript'
import { useEffect, useState } from 'react'
import { User } from '~/libs/models'

type ProjectInfoProps = {
    project: string
    user: User
    envFilter: Array<string>
}

export default function ProjectInfo(props: ProjectInfoProps) {
    const projectKey = props.project
    const [projData, setProjData] = useState<Project>()
    const envFilter = props.envFilter

    useEffect(() => {
        getProjectInfo(projectKey, props.user)
    }, [projectKey, props.user])

    const getProjectInfo = async (projectKey: string, user: User) => {
        const url = `https://app.launchdarkly.com/api/v2/projects/${projectKey}?expand=environments`
        const projectInfo = await fetch(url, {
            headers: new Headers({
                Authorization: `Bearer ${user.token}`,
                'Content-Type': 'application/json',
            }),
        })
        const projResp = await projectInfo.json()
        setProjData(projResp)
    }

    return (
        <div>
            {projData?.environments
                .filter((env) =>
                    envFilter ? envFilter.includes(env.key) : true
                )
                .map((environment) => {
                    return (
                        <p>
                            Environment: {environment.key}
                            <ul>
                                <li>ClientID: {environment._id}</li>
                                <li>SDK Key: {environment.apiKey}</li>
                            </ul>
                        </p>
                    )
                })}
        </div>
    )
}
