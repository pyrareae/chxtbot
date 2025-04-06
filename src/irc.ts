import IRC from "irc-framework"
import { pick } from "ramda"
import { Server } from "./config";
import CommandRunner from "./commandRunner";
import { CommandRepository } from "./database";


export interface MatchType {
  type: string;
  from_server: boolean;
  nick: string;
  ident: string;
  hostname: string;
  target: string;
  group: any;
  message: string;
  tags: {
    time: string, account: string
  },
  account: string;
  batch: any;
  reply: Function;
}

export interface Message {
  from?: string;
  message: string;
  time?: Date;
  channel: string;
}

export default class ChxtIrc {
  client: IRC.Client;
  config: Server;
  channels: Map<string, { messages: Message[] }> = new Map();
  matcher: RegExp;

  constructor(con: Server) {
    this.matcher = new RegExp(`^(${con.commandPrefix})(\\w+) +(.*)`)
    this.config = con
    const conf = {
      ...pick(['nick', 'username', 'encoding', 'version', 'port', 'host', 'channels'], con),
      account: pick(['account', 'password'], con)
    }
    // console.log(conf)
    this.client = new IRC.Client(conf)
    // this.client.on('raw', ({line}) => console.log(line))
    // this.client.on('debug', console.log)
    this.client.on('registered', () => {
      this.config.channels.forEach(channelName => {
        const channel = this.client.channel(channelName as string)
        channel.join()
        this.channels.set(channelName as string, { messages: [] });
      });
    });
    
    // Add listener for incoming messages
    this.client.on('message', (event) => {
      const { nick, target, message } = event;
      // Only store channel messages
      if (target.startsWith('#')) {
        const channelData = this.channels.get(target);
        if (channelData) {
          channelData.messages.push({
            from: nick,
            message,
            time: new Date(),
            channel: target
          });
          
          // Limit message history to 100 messages per channel
          if (channelData.messages.length > 100) {
            channelData.messages.shift();
          }
        }
      }
    });
    
    this.client.match(this.matcher, this.handleCommand.bind(this))
    this.client.connect()
  }

  async handleCommand(params: MatchType) {
    console.log("MATCH")
    console.log(params)
    //@ts-ignore
    const [fullMsg, prefix, command, argument] = params.message.match(this.matcher)
    console.log([fullMsg, prefix, command, argument])

    try {
      // First try to find a custom command in the database
      const dbCommand = await CommandRepository.findByName(command);
      
      if (dbCommand) {
        // Execute the custom command code
        try {
          const runner = new CommandRunner();
          const result = await runner.runScript(dbCommand.code, argument);
          params.reply(result || "Command executed successfully");
          return;
        } catch (error) {
          console.error("Error executing custom command:", error);
          params.reply(`Error executing custom command: ${error}`);
          return;
        }
      }
      
      // Fall back to built-in commands
      const runner = new CommandRunner();
      const {data} = await runner.run({name: command, argument});
      params.reply(data);
    } catch (error) {
      console.error("Error handling command:", error);
      params.reply(`Error: ${error}`);
    }
  }
  
  // Get messages for a specific channel
  getChannelMessages(channelName: string): Message[] | null {
    const channelData = this.channels.get(channelName);
    return channelData ? channelData.messages : null;
  }
  
  // Send a message to a channel
  sendMessage(channelName: string, message: string): boolean {
    if (!this.client.connected) {
      return false;
    }
    
    const channel = this.client.channel(channelName);
    if (!channel) {
      return false;
    }
    
    channel.say(message);
    
    // Add the message to our local storage too
    const channelData = this.channels.get(channelName);
    if (channelData) {
      channelData.messages.push({
        from: this.client.user.nick,
        message,
        time: new Date(),
        channel: channelName
      });
    }
    
    return true;
  }
}