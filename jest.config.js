const { defaults } = require('jest-config');
module.exports = {
  collectCoverageFrom: [
    "src/*.js",
    "!src/config.js",
  ]
}