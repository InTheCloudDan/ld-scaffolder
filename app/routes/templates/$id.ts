import { json } from 'remix'
import type { LoaderFunction } from 'remix'

export const loader: LoaderFunction = async ({ params, request }) => {
    const fs = require('fs')

    let rawdata = fs.readFileSync(`./public/templates/${params.id}.json`)
    let student = JSON.parse(rawdata)
    console.log(student)
    return student
}
