jest.mock('https')
jest.mock('../configuredCloudflare')

const { PassThrough } = require('stream')
const https = require('https')
const cf = require('../configuredCloudflare')
const sut = require('../lib')

describe('lib', () => {
  beforeEach(() => jest.restoreAllMocks())
  describe('getting existing DNS records', () => {
    it('should throw an error if an array is not passed', async () => {
      expect(sut.getExistingDnsRecords("bad input")).rejects.toThrow('zoneIds must be an array')
    })

    it('should avoid a network call if the input is empty', async () => {
      expect(await sut.getExistingDnsRecords([])).toEqual([])
      expect(cf.dnsRecords.browse).not.toHaveBeenCalled()
    })

    it('should get dns records for each zone requested', async () => {
      const zoneIds = [1, 2, 3];
      sut.getExistingDnsRecords(zoneIds)
      zoneIds.forEach(id => expect(cf.dnsRecords.browse).toHaveBeenCalledWith(id))
    })
  })

  describe('updating dns records', () => {
    it('should handle errors', async () => {
      jest.spyOn(global.console, 'error').mockImplementation(() => {})
      cf.dnsRecords.edit.mockRejectedValue(new Error('oh no'))
      await sut.updateDnsRecord(1, 2, {})
      expect(console.error).toHaveBeenCalled()

    })
  })

  describe('getting existing zones', () => {
    it('should work', async () => {
      const mockDnsResponse = { result: [{ id: 1 }, { id: 2 }] }
      cf.zones.browse.mockResolvedValueOnce(mockDnsResponse)

      const results = await sut.getExistingZones("a,b,c");

      expect(results).toEqual([1, 2])
      expect(cf.zones.browse).toHaveBeenCalledWith({ name: "a,b,c" })
    })
  })

  describe('getting a public IPv4', () => {
    it('should fail if it cannot connect to the IPv4 server', async () => {
      //arrange
      const mockResponse = new PassThrough();
      process.nextTick(() => mockResponse.emit('error', "oh no"))
      https.get = jest.fn().mockImplementation((url, cb) => cb(mockResponse));


      try {
        //act
        await sut.getIpv4();
      } catch (e) {
        //assert
        expect(https.get).toHaveBeenCalledWith('https://ipv4.icanhazip.com/', expect.any(Function))
        expect(e).toBe("oh no")
      }
    })

    it('should get its public IPv4', async () => {
      //arrange
      const mockResponse = new PassThrough();
      process.nextTick(() => {
        mockResponse.emit('data', 'f')
        mockResponse.emit('data', 'oo')
        mockResponse.emit('end')
      })
      https.get = jest.fn().mockImplementation((url, cb) => cb(mockResponse));

      //act
      const ipaddr = await sut.getIpv4();

      //assert
      expect(https.get).toHaveBeenCalledWith('https://ipv4.icanhazip.com/', expect.any(Function))
      expect(ipaddr).toBe('foo')
    })
  })
})
