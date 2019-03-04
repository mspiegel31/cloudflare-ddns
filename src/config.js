const { name, engines } = require('../package.json')
const semver = require('semver')

if (!semver.satisfies(process.version, engines.node)) {
    console.log(`${name} requires node version ${engines.node}`)
    console.log('exiting')
    process.exit(1)
}

const defaultConfig = {
    credentials: {
        email: "",
        key: ""
    },
    zones: [

    ]
}
module.exports = require('rc')(name, defaultConfig)