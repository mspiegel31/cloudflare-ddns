const { credentials, zones } = require('./config')

const https = require('https')
const cf = require('cloudflare')(credentials)


main();

//TODO: dry-run
//TODO: yargs?
//TODO: loop
async function main() {
    const domainsToFind = zones.map(zone => zone.name).join(',')
    const zoneIds = await cf.zones.browse({ name: domainsToFind })
        .then(resp => resp.result.map(zone => zone.id))


    const dnsRecords = await getExistingDnsRecords(zoneIds)
        .then(records => records.flatMap(record => record.result))
    
    const publicIp = await getIpv4();

    dnsRecords.forEach(record => {
        if (record.content === publicIp) {
            console.log(`record ${record.name} has most up-to-date ip`)
            return
        }

        const { zone_id, id } = record
        const updatedRecord = { ...record, content: publicIp }
        cf.dnsRecords.edit(zone_id, id, updatedRecord)
            .then(() => console.log(`record ${record.name} updating from ${record.content} -> ${publicIp}`))
            .catch(console.log)
    })
}

async function getExistingDnsRecords(zoneIds) {
    if (!Array.isArray(zoneIds)) {
        throw new Error('zoneIds must be an array')
    }

    if (zoneIds.length === 0) {
        return []
    }

    return Promise.all(zoneIds.map(id => cf.dnsRecords.browse(id)))

}

async function getIpv4() {
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

