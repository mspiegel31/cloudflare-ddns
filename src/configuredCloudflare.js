const { credentials } = require('./config')

module.exports = require('cloudflare')(credentials)