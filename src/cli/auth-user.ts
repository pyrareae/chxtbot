#!/usr/bin/env bun
import { initializeDatabase, UserRepository } from "../database";

async function authUser() {
  try {
    // Get ircAccount from command line arguments
    const ircAccount = process.argv[2];
    
    if (!ircAccount) {
      console.error("Error: IRC account is required.");
      console.log("Usage: bun run src/cli/auth-user.ts <ircAccount>");
      process.exit(1);
    }

    // Initialize database
    await initializeDatabase();
    console.log("Database initialized.");

    // Find the user
    const user = await UserRepository.findByIrcAccount(ircAccount);
    
    if (!user) {
      console.error(`Error: User with IRC account '${ircAccount}' not found.`);
      console.log("Use add-user command to create the user first.");
      process.exit(1);
    }

    // Set authenticated status to true
    user.isAuthenticated = true;
    await UserRepository.save(user);
    
    console.log(`User '${ircAccount}' is now authenticated.`);
    console.log("\nUser details:");
    console.log(`ID: ${user.id}`);
    console.log(`IRC Account: ${user.ircAccount}`);
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