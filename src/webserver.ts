import { serve } from "bun";
import { main, connections } from "./chxt";
import indexHtml from "../public/index.html";
import { initializeDatabase, UserRepository, CommandRepository } from "./database";

// Initialize database
const initializeApp = async () => {
  // Initialize database
  await initializeDatabase();
  console.log("Database initialized");

  // Start IRC client
  main.start();
  console.log("IRC client started");

  // Define API endpoints to interact with the IRC client
  const server = serve({
    routes: {
      // The main page - serves the React application
      "/": indexHtml,
      
      // API endpoint to get all connections
      "/api/connections": {
        GET() {
          const connectionsData = connections.map(conn => ({
            name: conn.client.options.host,
            channels: Array.from(conn.channels.keys()),
            connected: conn.client.connected
          }));
          return Response.json(connectionsData);
        }
      },
      
      // API endpoint to get messages for a specific channel
      "/api/messages": {
        GET(req: Request) {
          const url = new URL(req.url);
          const server = url.searchParams.get("server");
          const channel = url.searchParams.get("channel");
          
          if (!server || !channel) {
            return new Response("Server and channel parameters are required", { status: 400 });
          }
          
          // Find the connection for the specified server
          const connection = connections.find(conn => conn.client.options.host === server);
          if (!connection) {
            return new Response("Server not found", { status: 404 });
          }
          
          // Get the messages for the specified channel
          const channelMessages = connection.getChannelMessages(channel);
          if (!channelMessages) {
            return Response.json([]);
          }
          
          // Format messages for the client
          const messages = channelMessages.map((msg, index) => ({
            id: `${server}-${channel}-${index}`,
            sender: msg.from || "unknown",
            content: msg.message,
            timestamp: msg.time || new Date(),
            channel: channel,
            server: server
          }));
          
          return Response.json(messages);
        }
      },
      
      // API endpoint to send a message to a channel
      "/api/send-message": {
        async POST(req: Request) {
          try {
            const data = await req.json();
            const { server, channel, message } = data as { 
              server: string; 
              channel: string; 
              message: string 
            };
            
            if (!server || !channel || !message) {
              return new Response("Server, channel, and message are required", { status: 400 });
            }
            
            // Find the connection for the specified server
            const connection = connections.find(conn => conn.client.options.host === server);
            if (!connection) {
              return new Response("Server not found", { status: 404 });
            }
            
            // Send the message to the channel
            connection.sendMessage(channel, message);
            
            return new Response("Message sent", { status: 200 });
          } catch (error) {
            console.error("Error sending message:", error);
            return new Response("Error processing request", { status: 500 });
          }
        }
      },
      
      // API endpoints for database operations
      
      // Users API
      "/api/users": {
        async GET() {
          const users = await UserRepository.find();
          return Response.json(users);
        }
      },
      
      // Commands API
      "/api/commands": {
        async GET() {
          const commands = await CommandRepository.find({ relations: ["user"] });
          return Response.json(commands);
        },
        async POST(req: Request) {
          try {
            const { ircIdentifier, name, code } = await req.json() as {
              ircIdentifier: string;
              name: string;
              code: string;
            };
            
            if (!ircIdentifier || !name || !code) {
              return new Response("IRC identifier, command name, and code are required", { status: 400 });
            }
            
            // Find or create user
            const user = await UserRepository.findOrCreate(ircIdentifier);
            
            // Create command
            const command = await CommandRepository.createCommand(user, name, code);
            
            return Response.json(command);
          } catch (error) {
            console.error("Error creating command:", error);
            return new Response("Error processing request", { status: 500 });
          }
        }
      },
      
      // Single command API
      "/api/commands/:id": {
        async GET(req: Request) {
          const url = new URL(req.url);
          const id = parseInt(url.pathname.split("/").pop() || "0");
          
          if (isNaN(id) || id <= 0) {
            return new Response("Invalid command ID", { status: 400 });
          }
          
          const command = await CommandRepository.findOne({ 
            where: { id },
            relations: ["user"]
          });
          
          if (!command) {
            return new Response("Command not found", { status: 404 });
          }
          
          return Response.json(command);
        },
        async PUT(req: Request) {
          try {
            const url = new URL(req.url);
            const id = parseInt(url.pathname.split("/").pop() || "0");
            
            if (isNaN(id) || id <= 0) {
              return new Response("Invalid command ID", { status: 400 });
            }
            
            const { name, code, isActive } = await req.json() as {
              name: string;
              code: string;
              isActive: boolean;
            };
            
            if (!name || !code === undefined) {
              return new Response("Command name and code are required", { status: 400 });
            }
            
            const updatedCommand = await CommandRepository.updateCommand(id, name, code, isActive);
            
            if (!updatedCommand) {
              return new Response("Command not found", { status: 404 });
            }
            
            return Response.json(updatedCommand);
          } catch (error) {
            console.error("Error updating command:", error);
            return new Response("Error processing request", { status: 500 });
          }
        },
        async DELETE(req: Request) {
          const url = new URL(req.url);
          const id = parseInt(url.pathname.split("/").pop() || "0");
          
          if (isNaN(id) || id <= 0) {
            return new Response("Invalid command ID", { status: 400 });
          }
          
          const deleted = await CommandRepository.deleteCommand(id);
          
          if (!deleted) {
            return new Response("Command not found", { status: 404 });
          }
          
          return new Response("Command deleted", { status: 200 });
        }
      }
    },
    
    // Enable development mode for better error messages and hot reloading
    development: process.env.NODE_ENV !== "production",
  });

  console.log(`Server running at ${server.url}`);
};

// Start application
initializeApp().catch(error => {
  console.error("Failed to start application:", error);
  process.exit(1);
}); 