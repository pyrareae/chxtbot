import { serve } from "bun";
import { main, connections } from "./chxt";
import { initializeDatabase, UserRepository, CommandRepository } from "./database";
import CommandRunner from './commandRunner';
import indexHtml from "../public/index.html";
import config from "./config";
import { GoogleGenAI } from "@google/genai";
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
      
      // Authentication endpoint to verify tokens
      "/api/auth/verify": {
        async GET(req) {
          const url = new URL(req.url);
          const token = url.searchParams.get("token");
          
          if (!token) {
            return Response.json({ error: "Token is required" }, { status: 400 });
          }
          
          try {
            const user = await UserRepository.verifyAuthToken(token);
            
            if (!user) {
              return Response.json({ error: "Invalid or expired token" }, { status: 401 });
            }
            
            // Authenticate the user
            await UserRepository.authenticateUser(user);
            
            // Set a session cookie
            const headers = new Headers();
            const sessionId = crypto.randomUUID();
            headers.append("Set-Cookie", `session=${sessionId}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);
            
            // Store session in memory (in a real app, use Redis or similar)
            sessions.set(sessionId, { userId: user.id, authenticated: true });
            
            return new Response(JSON.stringify({ 
              success: true, 
              user: { 
                id: user.id, 
                ircAccount: user.ircAccount 
              } 
            }), { 
              headers,
              status: 200 
            });
          } catch (error) {
            console.error("Token verification error:", error);
            return Response.json({ error: "Authentication failed" }, { status: 500 });
          }
        }
      },
      
      // Check current session
      "/api/auth/session": {
        async GET(req) {
          try {
            const sessionId = getSessionFromCookie(req);
            
            if (!sessionId) {
              return Response.json({ authenticated: false }, { status: 401 });
            }
            
            const session = sessions.get(sessionId);
            
            if (!session || !session.authenticated) {
              return Response.json({ authenticated: false }, { status: 401 });
            }
            
            const user = await UserRepository.findOne({ where: { id: session.userId } });
            
            if (!user) {
              // Clear invalid session
              sessions.delete(sessionId);
              return Response.json({ authenticated: false }, { status: 401 });
            }
            
            return Response.json({ 
              authenticated: true, 
              user: { 
                id: user.id, 
                ircAccount: user.ircAccount 
              } 
            });
          } catch (error) {
            console.error("Session check error:", error);
            return Response.json({ error: "Session check failed" }, { status: 500 });
          }
        }
      },
      
      // Logout endpoint
      "/api/auth/logout": {
        POST(req) {
          const sessionId = getSessionFromCookie(req);
          
          if (sessionId) {
            sessions.delete(sessionId);
          }
          
          const headers = new Headers();
          headers.append("Set-Cookie", "session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0");
          
          return new Response(JSON.stringify({ success: true }), { 
            headers,
            status: 200 
          });
        }
      },
      
      // Users API
      "/api/users": {
        async GET(req) {
          // Check authentication
          if (!isAuthenticated(req)) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
          
          const users = await UserRepository.find();
          return Response.json(users);
        }
      },
      
      // Commands API
      "/api/commands": {
        GET: async (req) => {
          // Check authentication
          if (!isAuthenticated(req)) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
          
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
          // Check authentication
          if (!isAuthenticated(req)) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
          
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
              body.code,
              body.description
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
          // Check authentication
          if (!isAuthenticated(req)) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
          
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
          // Check authentication
          if (!isAuthenticated(req)) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
          
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
              body.isActive,
              body.description
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
          // Check authentication
          if (!isAuthenticated(req)) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
          
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
          // Check authentication
          if (!isAuthenticated(req)) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
          
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
            console.log(`Running command ${command.name} with code:\n${command.code}`);
            console.log(`Argument: "${argument}"`);
            
            const commandRunner = new CommandRunner();
            const result = await commandRunner.runScript(command.code, argument);
            
            console.log(`Command execution result type: ${typeof result}`);
            console.log(`Command execution result: "${result}"`);
            
            return Response.json({ 
              success: true, 
              result,
              command: {
                id: command.id,
                name: command.name
              }
            });
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
          // Check authentication
          if (!isAuthenticated(req)) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
          
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
      },
      
      // AI code generation endpoint
      "/api/ai/generate": {
        POST: async (req) => {
          // Check authentication
          if (!isAuthenticated(req)) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }
          
          try {
            const body = await req.json();
            
            // Validate required fields
            if (!body.code || !body.prompt) {
              return Response.json(
                { error: "Code and prompt are required" },
                { status: 400 }
              );
            }
            
            // Call the Gemini API
            const aiResponse = await generateCodeWithAI(body.code, body.prompt);
            
            return Response.json({ success: true, code: aiResponse });
          } catch (error) {
            console.error("Error generating code with AI:", error);
            return Response.json(
              { error: "Failed to generate code", message: error instanceof Error ? error.message : "Unknown error" },
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

// Session storage (in a real app, use Redis or similar)
const sessions = new Map();

// Helper function to get session ID from cookie
function getSessionFromCookie(req) {
  const cookies = req.headers.get("cookie");
  if (!cookies) return null;
  
  const sessionMatch = cookies.match(/session=([^;]+)/);
  return sessionMatch ? sessionMatch[1] : null;
}

// Helper function to check if request is authenticated
function isAuthenticated(req) {
  const sessionId = getSessionFromCookie(req);
  if (!sessionId) return false;
  
  const session = sessions.get(sessionId);
  return session && session.authenticated;
}

// Helper function for AI code generation using Gemini
async function generateCodeWithAI(code: string, prompt: string): Promise<string> {
  try {
    // Check if API key is configured
    const apiKey = config.api_keys?.gemini;
    if (!apiKey) {
      console.error("API key from config:", config.api_keys);
      throw new Error("Gemini API key not configured or not loaded properly. Check your config.toml file.");
    }
    
    console.log("Using Gemini API with key:", apiKey.substring(0, 10) + "...");
    
    // Initialize the Gemini API
    const genAI = new GoogleGenAI({apiKey});
    
    // Create a detailed prompt for the AI
    const systemPrompt = `
You are a JavaScript expert helping modify code for an IRC chatbot command.
Below is the current code and a request to modify it. 

CONTEXT:
- This is a command script for an IRC chatbot.
- The script should export a 'run' function that takes an argument and returns a string.
- Available APIs: You can use standard JavaScript functions and Node.js built-ins.
- You can make HTTP requests with fetch().
- The command will run in a sandboxed environment.

RULES:
- Return ONLY valid JavaScript code, with no explanations or markdown formatting.
- Do not include backticks, code blocks, or any text other than the JavaScript code itself.
- Always include the full, complete code (not just the changes).
- Ensure the code includes a 'run' function that takes an argument and returns a string.

CURRENT CODE:
\`\`\`javascript
${code}
\`\`\`

REQUESTED CHANGE:
${prompt}

IMPORTANT: Respond ONLY with the complete JavaScript code and nothing else.
`;
    
    // Generate content with Gemini
    // const result = await model.generateContent(systemPrompt);
    const result = await genAI.models.generateContent({
        model: "gemini-2.0-flash",
        contents: systemPrompt
    });
    // const response = result.response;
    let responseText = result.text;
    
    // Clean up the response to ensure we only get code
    // Remove any markdown code blocks if present
    responseText = responseText.replace(/```javascript|```js|```|`/g, '').trim();
    
    return responseText;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error(`AI code generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

// Start application
initializeApp().catch(error => {
  console.error("Failed to start application:", error);
  process.exit(1);
});

// Log config on startup
console.log("Config loaded:", {
  servers: config.servers.length, 
  apiKeys: config.api_keys ? Object.keys(config.api_keys) : "none"
}); 