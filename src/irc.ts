import IRC from "irc-framework"
import { pick } from "ramda"
import { Server } from "./config";


export default class ChxtIrc {
  client: IRC.Client;
  config: Server;
  channels: any[] = [];

  constructor(con: Server) {
    this.config = con
    const conf = {
      ...pick(['nick', 'username', 'encoding', 'version', 'port', 'host', 'channels'], con),
      account: pick(['account', 'password'], con)
    }
    console.log(conf)
    this.client = new IRC.Client(conf)
    this.client.on('raw', ({line}) => console.log(line))
    this.client.on('debug', console.log)
    this.client.on('registered', () => {
      this.channels = this.config.channels.map(channelName => {
        const channel = this.client.channel(channelName)
        channel.join()
        return channel
      })
    })
    this.client.connect()
  }
}