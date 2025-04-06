#!/usr/bin/env bun
import { initializeDatabase, UserRepository } from "../database";

async function authUser() {
  try {
    // Get ircIdentifier from command line arguments
    const ircIdentifier = process.argv[2];
    
    if (!ircIdentifier) {
      console.error("Error: IRC identifier is required.");
      console.log("Usage: bun run src/cli/auth-user.ts <ircIdentifier>");
      process.exit(1);
    }

    // Initialize database
    await initializeDatabase();
    console.log("Database initialized.");

    // Find the user
    const user = await UserRepository.findByIrcIdentifier(ircIdentifier);
    
    if (!user) {
      console.error(`Error: User with IRC identifier '${ircIdentifier}' not found.`);
      console.log("Use add-user command to create the user first.");
      process.exit(1);
    }

    // Set authenticated status to true
    user.isAuthenticated = true;
    await UserRepository.save(user);
    
    console.log(`User '${ircIdentifier}' is now authenticated.`);
    console.log("\nUser details:");
    console.log(`ID: ${user.id}`);
    console.log(`IRC Identifier: ${user.ircIdentifier}`);
    console.log(`Hostmask: ${user.hostmask || "not set"}`);
    console.log(`Authenticated: ${user.isAuthenticated ? "yes" : "no"}`);

  } catch (error) {
    console.error("Error authenticating user:", error);
    process.exit(1);
  } finally {
    // Exit process
    process.exit(0);
  }
}

// Run the function
authUser(); 