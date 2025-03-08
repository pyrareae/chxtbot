import IRC from "irc-framework"
import { pick } from "ramda"
import { Server } from "./config";


interface MatchType {
  type: String;
  from_server: boolean;
  nick: String;
  ident: String;
  hostname: String;
  target: String;
  group: any;
  message: String;
  tags: {
    time: String, account: String
  },
  account: String;
  batch: any;
  reply: Function;
}

export default class ChxtIrc {
  client: IRC.Client;
  config: Server;
  channels: any[] = [];
  matcher: RegExp;

  constructor(con: Server) {
    this.matcher = new RegExp(`^(${con.commandPrefix})(\\w+) +(.*)`)
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
    this.client.match(this.matcher, this.handleCommand.bind(this))
    this.client.connect()
  }

  handleCommand(params: MatchType) {
    console.log("MATCH")
    console.log(params)
    //@ts-ignore
    const [fullMsg, prefix, command, argument] = params.message.match(this.matcher)
    console.log([fullMsg, prefix, command, argument])
  }
}