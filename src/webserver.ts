import { serve } from "bun";
import { main, connections } from "./chxt";
import { initializeDatabase, UserRepository, CommandRepository } from "./database";
import CommandRunner from './commandRunner';
import indexHtml from "../public/index.html";

// Import global styles
import "./styles/globals.css";

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
    // Use HTML imports as routes
    routes: {
      // Route the HTML file to root and client-side routes
      "/*": indexHtml,
      
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
      
      // Users API
      "/api/users": {
        async GET() {
          const users = await UserRepository.find();
          return Response.json(users);
        }
      },
      
      // Commands API
      "/api/commands": {
        GET: async () => {
          try {
            const commands = await CommandRepository.find({
              relations: ["user"],
              order: { name: "ASC" }
            });
            return Response.json(commands);
          } catch (error) {
            console.error("Error fetching commands:", error);
            return Response.json({ error: "Failed to fetch commands" }, { status: 500 });
          }
        },
        POST: async (req) => {
          try {
            const body = await req.json();
            
            // Validate required fields
            if (!body.name || !body.code) {
              return Response.json(
                { error: "Name and code are required" },
                { status: 400 }
              );
            }

            // Find the user
            const user = await UserRepository.findOne({ where: { id: body.userId } });
            if (!user) {
              return Response.json({ error: "User not found" }, { status: 404 });
            }
            
            // Create the command
            const command = await CommandRepository.createCommand(
              user,
              body.name,
              body.code
            );
            
            return Response.json(command);
          } catch (error) {
            console.error("Error creating command:", error);
            return Response.json({ error: "Failed to create command" }, { status: 500 });
          }
        }
      },
      
      // Individual command route
      "/api/commands/:id": {
        GET: async (req) => {
          try {
            const { id } = req.params;
            const commandId = parseInt(id);
            
            if (isNaN(commandId)) {
              return Response.json({ error: "Invalid ID" }, { status: 400 });
            }
            
            const command = await CommandRepository.findOne({
              where: { id: commandId },
              relations: ["user"]
            });
            
            if (!command) {
              return Response.json({ error: "Command not found" }, { status: 404 });
            }
            
            return Response.json(command);
          } catch (error) {
            console.error("Error fetching command:", error);
            return Response.json({ error: "Failed to fetch command" }, { status: 500 });
          }
        },
        PUT: async (req) => {
          try {
            const { id } = req.params;
            const commandId = parseInt(id);
            
            if (isNaN(commandId)) {
              return Response.json({ error: "Invalid ID" }, { status: 400 });
            }
            
            const body = await req.json();
            
            // Validate required fields
            if (!body.name || !body.code) {
              return Response.json(
                { error: "Name and code are required" },
                { status: 400 }
              );
            }
            
            // Update the command
            const updatedCommand = await CommandRepository.updateCommand(
              commandId,
              body.name,
              body.code,
              body.isActive
            );
            
            if (!updatedCommand) {
              return Response.json({ error: "Command not found" }, { status: 404 });
            }
            
            return Response.json(updatedCommand);
          } catch (error) {
            console.error("Error updating command:", error);
            return Response.json({ error: "Failed to update command" }, { status: 500 });
          }
        },
        DELETE: async (req) => {
          try {
            const { id } = req.params;
            const commandId = parseInt(id);
            
            if (isNaN(commandId)) {
              return Response.json({ error: "Invalid ID" }, { status: 400 });
            }
            
            const success = await CommandRepository.deleteCommand(commandId);
            
            if (!success) {
              return Response.json({ error: "Command not found" }, { status: 404 });
            }
            
            return Response.json({ success: true });
          } catch (error) {
            console.error("Error deleting command:", error);
            return Response.json({ error: "Failed to delete command" }, { status: 500 });
          }
        }
      },
      
      // Command run route
      "/api/commands/:id/run": {
        POST: async (req) => {
          try {
            const { id } = req.params;
            const commandId = parseInt(id);
            
            if (isNaN(commandId)) {
              return Response.json({ error: "Invalid ID" }, { status: 400 });
            }
            
            // Get the command
            const command = await CommandRepository.findOne({
              where: { id: commandId }
            });
            
            if (!command) {
              return Response.json({ error: "Command not found" }, { status: 404 });
            }
            
            // Extract any argument from the request body
            let argument = "";
            try {
              const body = await req.json();
              argument = body.argument || "";
            } catch (e) {
              // If no body is provided, use an empty argument
            }
            
            // Run the command
            const commandRunner = new CommandRunner();
            const result = await commandRunner.runScript(command.code, argument);
            
            return Response.json({ success: true, result });
          } catch (error) {
            console.error("Error running command:", error);
            return Response.json(
              { error: "Failed to run command", message: error instanceof Error ? error.message : "Unknown error" },
              { status: 500 }
            );
          }
        }
      },
      
      // Command test route
      "/api/commands/test": {
        POST: async (req) => {
          try {
            const body = await req.json();
            
            // Validate required fields
            if (!body.code) {
              return Response.json(
                { error: "Code is required" },
                { status: 400 }
              );
            }
            
            // Run the command with the provided code and argument
            const commandRunner = new CommandRunner();
            const result = await commandRunner.runScript(body.code, body.argument || "");
            
            return Response.json({ success: true, result });
          } catch (error) {
            console.error("Error testing command:", error);
            return Response.json(
              { error: "Failed to test command", message: error instanceof Error ? error.message : "Unknown error" },
              { status: 500 }
            );
          }
        }
      }
    },
    
    // Enable development mode for better error messages and hot reloading
    development: process.env.NODE_ENV !== "production",
  });

  console.log("Starting webserver on http://localhost:3000");
  console.log("API routes available at /api/*");
  console.log("UI available at / and all client-side routes with React Router");

  console.log(`Server running at ${server.url}`);
};

// Start application
initializeApp().catch(error => {
  console.error("Failed to start application:", error);
  process.exit(1);
}); 