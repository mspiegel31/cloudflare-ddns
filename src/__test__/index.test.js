jest.mock('https')
jest.mock('../configuredCloudflare')
jest.mock('../lib')

const sut = require('../index')
const lib = require('../lib')


describe('updating cloudflare dns records', () => {
  beforeEach(() => {
    jest.spyOn(global.console, "log")
    jest.spyOn(global.console, "error")
    jest.resetAllMocks()
  })

  describe('The main script logic', () => {
    it('should ignore records that are up-to-date', async () => {
      const mockPublicIp = "192.168.1.1"
      lib.getIpv4.mockResolvedValue(mockPublicIp)
      lib.getExistingZones.mockResolvedValue([1, 2, 3])
      lib.getExistingDnsRecords.mockResolvedValue([
        { result: [{ name: "michael", zone_id: 1, id: 2, content: mockPublicIp }] },
        { result: [{ name: "daniel", zone_id: 2, id: 3, content: mockPublicIp }] },
        { result: [{ name: "sammie", zone_id: 3, id: 4, content: mockPublicIp }] },
      ])


      await sut.main(['a,b,c'])

      expect(lib.updateDnsRecord).not.toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledTimes(3)
    })

    it('should update records that do not contain the latest IP', async () => {
      const mockPublicIp = "192.168.1.1"
      lib.getIpv4.mockResolvedValue(mockPublicIp)
      lib.getExistingZones.mockResolvedValue([1, 2, 3])
      lib.updateDnsRecord.mockResolvedValue({})
      lib.getExistingDnsRecords.mockResolvedValue([
        { result: [{ name: "michael", zone_id: 1, id: 2, content: "192.168.1.6" }] },
        { result: [{ name: "daniel", zone_id: 2, id: 3, content: "192.168.1.7" }] },
        { result: [{ name: "sammie", zone_id: 3, id: 4, content: "192.168.1.8" }] },
      ])

      await sut.main(['a,b,c'])

      expect(lib.updateDnsRecord).toHaveBeenCalledTimes(3)
      expect(console.log).toHaveBeenCalledTimes(3)
    })

    it('should avoid an update if a dry-run is requested', async () => {
      const mockPublicIp = "192.168.1.1"
      lib.getIpv4.mockResolvedValue(mockPublicIp)
      lib.getExistingZones.mockResolvedValue([1, 2, 3])
      lib.updateDnsRecord.mockResolvedValue({})
      lib.getExistingDnsRecords.mockResolvedValue([
        { result: [{ name: "michael", zone_id: 1, id: 2, content: "192.168.1.6" }] },
        { result: [{ name: "daniel", zone_id: 2, id: 3, content: "192.168.1.7" }] },
        { result: [{ name: "sammie", zone_id: 3, id: 4, content: "192.168.1.8" }] },
      ])

      await sut.main(['a,b,c'], true)

      expect(lib.updateDnsRecord).toHaveBeenCalledTimes(0)
      expect(console.log).toHaveBeenCalledTimes(3)
    })
  })
})