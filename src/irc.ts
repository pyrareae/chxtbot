import IRC from "irc-framework"
import { pick } from "ramda"
import { Server } from "./config";
import CommandRunner from "./commandRunner";
import { CommandRepository, UserRepository, AppDataSource, Command } from "./database";


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
    this.matcher = new RegExp(`^(${con.commandPrefix})(\\w+)(?:\\s+(.*))?$`)
    this.config = con
    const conf = {
      ...pick(['nick', 'username', 'encoding', 'version', 'port', 'host', 'channels'], con),
      account: pick(['account', 'password'], con)
    }
    this.client = new IRC.Client(conf)

    if (process.env.DEBUG) {
      console.log(conf)
      this.client.on('raw', ({line}) => console.log(line))
      this.client.on('debug', console.log)
    }

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
    
    // Add listener for channel invitations
    this.client.on('invite', (event: { channel: string; nick: string }) => {
      const { channel, nick } = event;
      console.log(`Received invitation from ${nick} to join ${channel}`);
      
      // Join the channel
      this.client.join(channel);
      
      // Initialize channel tracking
      if (!this.channels.has(channel)) {
        this.channels.set(channel, { messages: [] });
      }
    });
    
    this.client.match(this.matcher, this.handleCommand.bind(this))
    this.client.connect()
  }

  async handleCommand(params: MatchType) {
    console.log("MATCH")
    console.log(params)
    
    //@ts-ignore
    const [fullMsg, prefix, command, argument = ''] = params.message.match(this.matcher)
    console.log([fullMsg, prefix, command, argument])

    // Handle special dash command for authentication
    if (command === "dash") {
      return await this.handleDashCommand(params);
    }

    // Handle help command
    if (command === "help") {
      return await this.handleHelpCommand(params);
    }

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
  
  /**
   * Handle the dash command which provides access to the dashboard
   */
  async handleDashCommand(params: MatchType) {
    try {
      const { nick, account } = params;
      console.log(`Dash command from ${nick}, IRC account: ${account}`);
      
      // Check if user is authenticated with the IRC server
      if (!account) {
        params.reply("You must be authenticated with the IRC server to use the dashboard. Please register your nickname with IRC services.");
        return;
      }
      
      // Find user by IRC account name
      let user = await UserRepository.findByIrcAccount(account);
      
      if (!user) {
        params.reply("You don't have access to the dashboard. Please contact an administrator.");
        return;
      }
      
      // Generate authentication token
      const token = await UserRepository.generateAuthToken(user);
      
      // Create magic link
      const baseUrl = process.env.BASE_URL || "http://localhost:3000";
      const magicLink = `${baseUrl}/auth?token=${token}`;
      
      // Send DM with magic link
      this.sendDirectMessage(nick, `Click this link to access the dashboard: ${magicLink}`);
      this.sendDirectMessage(nick, "This link will expire in 24 hours.");
      
      // Respond in channel with a generic message
      params.reply("Check your private messages for dashboard access instructions.");
      
    } catch (error) {
      console.error("Error handling dash command:", error);
      params.reply("Error processing your request. Please try again later.");
    }
  }
  
  /**
   * Handle the help command which lists all available commands
   */
  async handleHelpCommand(params: MatchType) {
    try {
      // Get all custom commands from the database
      const customCommands = await this.getAllCustomCommands();
      
      // Built-in commands list
      const builtInCommands = ["dash", "help"];
      
      // Generate the help message
      let helpMessage = "Available commands:\n";
      
      // Add built-in commands
      helpMessage += "Built-in commands: " + builtInCommands.map(cmd => this.config.commandPrefix + cmd).join(", ");
      
      // Add custom commands if any exist
      if (customCommands && customCommands.length > 0) {
        helpMessage += "\nCustom commands: " + customCommands.map((cmd: { name: string }) => this.config.commandPrefix + cmd.name).join(", ");
      }
      
      // Send the help message
      params.reply(helpMessage);
      
    } catch (error) {
      console.error("Error handling help command:", error);
      params.reply("Error processing your request. Please try again later.");
    }
  }
  
  /**
   * Get all custom commands from the database
   */
  private async getAllCustomCommands() {
    // Use the AppDataSource to get all commands
    return await AppDataSource.getRepository(Command)
      .createQueryBuilder("command")
      .where("command.isActive = :isActive", { isActive: true })
      .orderBy("command.name", "ASC")
      .getMany();
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
  
  // Send a direct message to a user
  sendDirectMessage(nickname: string, message: string): boolean {
    if (!this.client.connected) {
      return false;
    }
    
    try {
      this.client.say(nickname, message);
      return true;
    } catch (error) {
      console.error(`Error sending DM to ${nickname}:`, error);
      return false;
    }
  }
}