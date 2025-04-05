declare module 'bun' {
  export function serve(options: {
    routes: Record<string, any>;
    development?: boolean;
    fetch?: (req: Request) => Promise<Response> | Response;
  }): { url: string };
}

declare module '*.html' {
  const content: string;
  export default content;
}

declare module 'irc-framework' {
  namespace IRC {
    class Client {
      constructor(options: any);
      options: any;
      user: { nick: string };
      connected: boolean;
      connect(): void;
      on(event: string, callback: (...args: any[]) => void): void;
      match(pattern: RegExp, callback: (params: any) => void): void;
      channel(name: string): {
        join(): void;
        say(message: string): void;
      };
    }
  }
  export default IRC;
} 