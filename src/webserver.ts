import { serve } from "bun";
import { main, connections } from "./chxt";
import indexHtml from "../public/index.html";

// Start IRC client
main.start();

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
    }
  },
  
  // Enable development mode for better error messages and hot reloading
  development: process.env.NODE_ENV !== "production",
});

console.log(`Server running at ${server.url}`); 