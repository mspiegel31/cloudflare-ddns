const https = require('https')
const cf = require('./configuredCloudflare')

exports.getExistingDnsRecords = async function (zoneIds) {
  if (!Array.isArray(zoneIds)) {
    throw new Error('zoneIds must be an array')
  }

  if (zoneIds.length === 0) {
    return []
  }

  return Promise.all(zoneIds.map(id => cf.dnsRecords.browse(id)))
    .catch(console.error)

}

exports.getExistingZones = function (domainsToFind) {
  return cf.zones.browse({ name: domainsToFind })
    .then(resp => resp.result.map(zone => zone.id))
    .catch(e => {
      console.error('error fetching zones')
      throw new Error(e)
    })

}

exports.updateDnsRecord = function(zone_id, id, updatedRecord) {
  return cf.dnsRecords.edit(zone_id, id, updatedRecord)
    .catch(console.error)

}

exports.getIpv4 = function () {
  return new Promise((resolve, reject) => {
    https.get('https://ipv4.icanhazip.com/', res => {
      res.setEncoding('utf8')

      let body = ''
      res.on('data', data => body += data)
      res.on('end', () => resolve(body.trim()))
      res.on('error', reject)
    })
  })
}