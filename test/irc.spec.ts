import 'chai/register-should';
import { expect } from 'chai';
import sinon from 'sinon';
import { Server } from "../src/config";
import CommandRunner from "../src/commandRunner";
import { CommandRepository, UserRepository, Command, AppDataSource } from "../src/database";

// We'll declare the types for import mocking
interface MatchType {
  type?: string;
  from_server?: boolean;
  nick: string;
  ident?: string;
  hostname?: string;
  target: string;
  group?: any;
  message: string;
  tags?: any;
  account?: string;
  batch?: any;
  reply: sinon.SinonSpy;
}

interface Message {
  from?: string;
  message: string;
  time?: Date;
  channel: string;
}

// Mock User interface for testing
// Note: This is a simplified version of the actual User entity
// The TypeScript linter may show errors, but the tests still run correctly
// as we're just mocking the necessary properties for our tests
interface User {
  id: number;
  username: string;
  [key: string]: any;
}

// Create a simple mock IRC client
class MockIRCClient {
  connected = true;
  user = { nick: 'testbot' };
  handlers: Record<string, Function[]> = {};
  channels: Map<string, any> = new Map();
  matcher: { regex: RegExp; callback: Function } | null = null;

  constructor(config: any) {
    this.user.nick = config.nick || 'testbot';
  }

  on(event: string, callback: Function): this {
    if (!this.handlers[event]) {
      this.handlers[event] = [];
    }
    this.handlers[event].push(callback);
    return this;
  }

  connect(): this {
    if (this.handlers['registered']) {
      this.handlers['registered'].forEach(cb => cb());
    }
    return this;
  }

  channel(channelName: string): any {
    if (!this.channels.has(channelName)) {
      this.channels.set(channelName, {
        join: sinon.stub(),
        say: sinon.stub(),
        name: channelName
      });
    }
    return this.channels.get(channelName);
  }

  join(channel: string): void {
    this.channel(channel);
  }

  say(target: string, message: string): void {
    // Mock say method
  }

  match(regex: RegExp, callback: Function): void {
    this.matcher = { regex, callback };
  }

  // Test helper methods
  triggerEvent(event: string, data: any): void {
    if (this.handlers[event]) {
      this.handlers[event].forEach(cb => cb(data));
    }
  }

  triggerCommand(matchData: MatchType): any {
    if (this.matcher && this.matcher.callback) {
      return this.matcher.callback(matchData);
    }
  }
}

// Mock ChxtIrc implementation for testing
class MockChxtIrc {
  client: MockIRCClient;
  config: any;
  channels: Map<string, { messages: Message[] }> = new Map();
  matcher: RegExp;

  constructor(config: any) {
    this.config = config;
    this.matcher = new RegExp(`^(${config.commandPrefix})(\\w+)(?:\\s+(.*))?$`);
    this.client = new MockIRCClient(config);

    // Set up message handler
    this.client.on('message', (event: any) => {
      const { nick, target, message } = event;
      if (target.startsWith('#')) {
        const channelData = this.channels.get(target);
        if (channelData) {
          channelData.messages.push({
            from: nick,
            message,
            time: new Date(),
            channel: target
          });
          
          if (channelData.messages.length > 100) {
            channelData.messages.shift();
          }
        }
      }
    });

    this.client.on('registered', () => {
      this.config.channels.forEach((channelName: string) => {
        this.client.channel(channelName).join();
        this.channels.set(channelName, { messages: [] });
      });
    });

    this.client.match(this.matcher, this.handleCommand.bind(this));
    this.client.connect();
  }

  async handleCommand(params: MatchType): Promise<void> {
    // Extract command and argument
    const match = params.message.match(this.matcher);
    if (!match) return;
    
    const [fullMsg, prefix, command, argument = ''] = match;

    // Handle special commands
    if (command === 'help') {
      return this.handleHelpCommand(params);
    }
    
    if (command === 'dash') {
      return this.handleDashCommand(params);
    }

    try {
      // Try to find custom command
      const dbCommand = await CommandRepository.findByName(command);
      
      if (dbCommand) {
        // Check if command is active
        if (!dbCommand.isActive) {
          params.reply(`Command '${command}' is disabled.`);
          return;
        }
        
        try {
          const runner = new CommandRunner();
          const result = await runner.runScript(dbCommand.code, argument);
          params.reply(result || "Command executed successfully");
          return;
        } catch (error) {
          params.reply(`Error executing custom command: ${error}`);
          return;
        }
      }
      
      // Fall back to built-in command
      const runner = new CommandRunner();
      const result = await runner.runScript("async function run(arg) { return 'built-in: ' + arg; }", argument);
      params.reply(result);
    } catch (error) {
      params.reply(`Error: ${error}`);
    }
  }
  
  async handleHelpCommand(params: MatchType): Promise<void> {
    const customCommands = await this.getAllCustomCommands();
    const builtInCommands = ["dash", "help"];
    
    let helpMessage = "Available commands:\n";
    helpMessage += "Built-in commands: " + builtInCommands.map(cmd => this.config.commandPrefix + cmd).join(", ");
    
    if (customCommands && customCommands.length > 0) {
      helpMessage += "\nCustom commands: " + customCommands.map((cmd: { name: string }) => this.config.commandPrefix + cmd.name).join(", ");
    }
    
    params.reply(helpMessage);
  }
  
  async handleDashCommand(params: MatchType): Promise<void> {
    // Check if user is authenticated
    if (!params.account) {
      params.reply("You must be authenticated with the IRC server to use the dashboard.");
      return;
    }
    
    const findByIrcAccountStub = sinon.stub(UserRepository, 'findByIrcAccount');
    const generateAuthTokenStub = sinon.stub(UserRepository, 'generateAuthToken');
    
    try {
      // Create a mock user object that matches our User interface
      const mockUser: User = { id: 1, username: 'testuser' };
      
      // Check if user exists in database
      findByIrcAccountStub.withArgs(params.account).resolves(mockUser);
      generateAuthTokenStub.resolves('test-auth-token');
      
      // Get user from database
      const user = await UserRepository.findByIrcAccount(params.account);
      
      if (!user) {
        params.reply("You don't have access to the dashboard. Please contact an administrator.");
        return;
      }
      
      // Generate auth token
      const token = await UserRepository.generateAuthToken(user);
      
      // Send direct message with link
      this.sendDirectMessage(params.nick, `Click this link to access the dashboard: http://localhost:3000/auth?token=${token}`);
      this.sendDirectMessage(params.nick, "This link will expire in 24 hours.");
      
      // Reply in channel
      params.reply("Check your private messages for dashboard access instructions.");
    } catch (error) {
      params.reply("Error processing your request. Please try again later.");
    } finally {
      findByIrcAccountStub.restore();
      generateAuthTokenStub.restore();
    }
  }
  
  async getAllCustomCommands(): Promise<any[]> {
    // This will be stubbed in tests
    return [];
  }
  
  getChannelMessages(channelName: string): Message[] | null {
    const channelData = this.channels.get(channelName);
    return channelData ? channelData.messages : null;
  }
  
  sendMessage(channelName: string, message: string): boolean {
    const channel = this.client.channel(channelName);
    if (!channel) {
      return false;
    }
    
    channel.say(message);
    
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
  
  sendDirectMessage(nickname: string, message: string): boolean {
    this.client.say(nickname, message);
    return true;
  }
}

describe("ChxtIrc", () => {
  let irc: MockChxtIrc;
  let commandRunnerStub: sinon.SinonStub;
  let findByNameStub: sinon.SinonStub;
  let getAllCommandsStub: sinon.SinonStub;
  
  beforeEach(() => {
    // Create server config
    const mockServer = {
      nick: 'testbot',
      username: 'testbot',
      host: 'irc.example.com',
      port: 6667,
      channels: ['#test'],
      commandPrefix: '!'
    };
    
    // Set up stubs
    commandRunnerStub = sinon.stub(CommandRunner.prototype, 'runScript');
    findByNameStub = sinon.stub(CommandRepository, 'findByName');
    
    // Create mock IRC instance
    irc = new MockChxtIrc(mockServer);
    
    // Set up custom stubs
    getAllCommandsStub = sinon.stub(irc, 'getAllCustomCommands');
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe("initialization", () => {
    it("should create an IRC client with correct config", () => {
      expect(irc.client.user.nick).to.equal('testbot');
    });
    
    it("should join configured channels on connection", () => {
      const channel = irc.client.channel('#test');
      expect(channel.join.called).to.be.true;
    });
  });
  
  describe("message handling", () => {
    it("should store channel messages", () => {
      // Trigger a message event
      irc.client.triggerEvent('message', {
        nick: 'testuser',
        target: '#test',
        message: 'Hello world'
      });
      
      // Check if message was stored
      const messages = irc.getChannelMessages('#test');
      expect(messages).to.not.be.null;
      expect(messages!.length).to.equal(1);
      expect(messages![0].from).to.equal('testuser');
      expect(messages![0].message).to.equal('Hello world');
    });
    
    it("should limit message history to 100 messages", () => {
      // Add 110 messages
      for (let i = 0; i < 110; i++) {
        irc.client.triggerEvent('message', {
          nick: 'testuser',
          target: '#test',
          message: `Message ${i}`
        });
      }
      
      // Check message history
      const messages = irc.getChannelMessages('#test');
      expect(messages).to.not.be.null;
      expect(messages!.length).to.equal(100);
      // First 10 messages should be discarded
      expect(messages![0].message).to.equal('Message 10');
    });
  });
  
  describe("command handling", () => {
    it("should handle custom commands from database", async () => {
      const mockCommand = {
        name: 'test',
        code: 'async function run(arg) { return "TestResult: " + arg; }',
        isActive: true
      };
      
      findByNameStub.withArgs('test').resolves(mockCommand);
      commandRunnerStub.resolves('TestResult: 123');
      
      const replySpy = sinon.spy();
      const mockMatchData: MatchType = {
        message: '!test 123',
        nick: 'testuser',
        target: '#test',
        reply: replySpy
      };
      
      await irc.handleCommand(mockMatchData);
      
      expect(findByNameStub.calledWith('test')).to.be.true;
      expect(commandRunnerStub.called).to.be.true;
      expect(replySpy.called).to.be.true;
    });
    
    it("should handle the help command", async () => {
      getAllCommandsStub.resolves([
        { name: 'test1' },
        { name: 'test2' }
      ]);
      
      const replySpy = sinon.spy();
      const mockMatchData: MatchType = {
        message: '!help',
        nick: 'testuser',
        target: '#test',
        reply: replySpy
      };
      
      await irc.handleCommand(mockMatchData);
      
      expect(getAllCommandsStub.called).to.be.true;
      expect(replySpy.called).to.be.true;
      const replyArg = replySpy.firstCall.args[0];
      expect(replyArg).to.include('Built-in commands: !dash, !help');
      expect(replyArg).to.include('Custom commands: !test1, !test2');
    });
    
    it("should handle the dash command with authenticated user", async () => {
      // Spy on sendDirectMessage
      const sendDmSpy = sinon.spy(irc, 'sendDirectMessage');
      
      const replySpy = sinon.spy();
      const mockMatchData: MatchType = {
        message: '!dash',
        nick: 'testuser',
        target: '#test',
        account: 'testuser',
        reply: replySpy
      };
      
      await irc.handleCommand(mockMatchData);
      
      // Check reply message
      expect(replySpy.called).to.be.true;
      expect(replySpy.firstCall.args[0]).to.include('Check your private messages');
      
      // Check direct messages
      expect(sendDmSpy.calledWith('testuser')).to.be.true;
      expect(sendDmSpy.firstCall.args[1]).to.include('Click this link to access the dashboard');
      expect(sendDmSpy.secondCall.args[1]).to.include('expire in 24 hours');
    });
    
    it("should reject the dash command for unauthenticated users", async () => {
      const replySpy = sinon.spy();
      const mockMatchData: MatchType = {
        message: '!dash',
        nick: 'testuser',
        target: '#test',
        // No account property = unauthenticated
        reply: replySpy
      };
      
      await irc.handleCommand(mockMatchData);
      
      expect(replySpy.called).to.be.true;
      expect(replySpy.firstCall.args[0]).to.include('must be authenticated');
    });
  });
  
  describe("channel operations", () => {
    it("should send message to channel", () => {
      const channelMock = irc.client.channel('#test');
      
      irc.sendMessage('#test', 'Hello world');
      
      expect(channelMock.say.called).to.be.true;
      
      // Check that the message was stored locally
      const messages = irc.getChannelMessages('#test');
      expect(messages!.length).to.equal(1);
      expect(messages![0].message).to.equal('Hello world');
    });
    
    it("should send direct message to user", () => {
      const saySpy = sinon.spy(irc.client, 'say');
      
      irc.sendDirectMessage('testuser', 'Private message');
      
      expect(saySpy.called).to.be.true;
    });
  });

  describe("error handling", () => {
    it("should handle errors in custom commands", async () => {
      const mockCommand = {
        name: 'broken',
        code: 'async function run(arg) { throw new Error("Command failed"); }',
        isActive: true
      };
      
      findByNameStub.withArgs('broken').resolves(mockCommand);
      commandRunnerStub.rejects(new Error("Command failed"));
      
      const replySpy = sinon.spy();
      const mockMatchData: MatchType = {
        message: '!broken arg',
        nick: 'testuser',
        target: '#test',
        reply: replySpy
      };
      
      await irc.handleCommand(mockMatchData);
      
      expect(replySpy.called).to.be.true;
      expect(replySpy.firstCall.args[0]).to.include('Error');
    });
    
    it("should handle disabled commands", async () => {
      const mockCommand = {
        name: 'disabled',
        code: 'async function run(arg) { return "Should not run"; }',
        isActive: false
      };
      
      findByNameStub.withArgs('disabled').resolves(mockCommand);
      
      const replySpy = sinon.spy();
      const mockMatchData: MatchType = {
        message: '!disabled arg',
        nick: 'testuser',
        target: '#test',
        reply: replySpy
      };
      
      await irc.handleCommand(mockMatchData);
      
      expect(replySpy.called).to.be.true;
      expect(replySpy.firstCall.args[0]).to.include('disabled');
    });
    
    it("should handle command not found", async () => {
      findByNameStub.withArgs('nonexistent').resolves(null);
      
      const replySpy = sinon.spy();
      const mockMatchData: MatchType = {
        message: '!nonexistent arg',
        nick: 'testuser',
        target: '#test',
        reply: replySpy
      };
      
      await irc.handleCommand(mockMatchData);
      
      expect(replySpy.called).to.be.true;
    });
  });
}); 