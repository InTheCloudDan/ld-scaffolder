import { Project } from 'launchdarkly-api-typescript'
import { useEffect, useState } from 'react'
import { User } from '~/libs/models'

type ProjectInfoProps = {
    project: string
    user: User
}

export default function ProjectInfo(props: ProjectInfoProps) {
    const projectKey = props.project
    const [projData, setProjData] = useState<Project>()

    useEffect(() => {
        getProjectInfo(projectKey, props.user)
    }, [])

    const getProjectInfo = async (projectKey: string, user: User) => {
        const url = `https://app.launchdarkly.com/api/v2/projects/${projectKey}?expand=environments`
        const projectInfo = await fetch(url, {
            headers: new Headers({
                Authorization: `Bearer ${user.token}`,
                'Content-Type': 'application/json',
            }),
        })
        const projResp = await projectInfo.json()
        console.log(projResp)
        setProjData(projResp)
    }

    return (
        <p>
            {projData?.environments.map((environment) => {
                ;<li>{environment.apiKey}</li>
            })}
        </p>
    )
}
