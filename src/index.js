const yargs = require('yargs')
const { zones } = require('./config')
const { getExistingDnsRecords, getIpv4, getExistingZones, updateDnsRecord } = require('./lib')

exports.main = async function (zones, dryRun = false) {
  try {
    const domainsToFind = zones.map(zone => zone.name).join(',')
    const dnsRecords = await getExistingZones(domainsToFind)
      .then(getExistingDnsRecords)
      .then(records => records.flatMap(record => record.result))

    const publicIp = await getIpv4();

    return await dnsRecords.map(record => processRecord(record, publicIp, dryRun))
  } catch(e) {
    console.error(e)
  }
}

async function processRecord(record, publicIp, dryRun) {
  if (record.content === publicIp) {
    console.log(`record ${record.name} has most up-to-date ip`)
    return
  }

  if (dryRun) {
    console.log(`record ${record.name} will update from ${record.content} -> ${publicIp}`)
    return
  }

  const { zone_id, id } = record
  const updatedRecord = { ...record, content: publicIp }
  updateDnsRecord(zone_id, id, updatedRecord)
    .then(() => console.log(`record ${record.name} updating from ${record.content} -> ${publicIp}`))
    .catch(console.error)
}

/* istanbul ignore next */
if (require.main === module) {
  const { argv } = yargs
    .option("dry-run", {
      type: 'boolean',
      default: false
    })
    .scriptName('cloudflare-ddns')
    .help()

  exports.main(zones, argv.dryRun);
}