const { name } = require('./package.json')
const defaultConfig = {
    credentials: {
        email: "",
        key: ""
    },
    zones: [

    ]
}
module.exports = require('rc')(name, defaultConfig)