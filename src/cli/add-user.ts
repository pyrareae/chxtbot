#!/usr/bin/env bun
import { initializeDatabase, UserRepository } from "../database";
import { parseArgs } from "util";

async function addUser() {
  try {
    // Parse command line arguments
    const options = {
      ircAccount: { type: "string" as const, short: "i" },
      isAuthenticated: { type: "boolean" as const, short: "a" },
    };

    const {
      values,
      positionals,
    } = parseArgs({
      args: process.argv.slice(2),
      options,
      allowPositionals: true,
    });

    // Check for required arguments
    const ircAccount = values.ircAccount || positionals[0];
    if (!ircAccount) {
      console.error("Error: IRC account is required.");
      console.log("Usage: bun run src/cli/add-user.ts -i <ircAccount> [-a]");
      console.log("   or: bun run src/cli/add-user.ts <ircAccount>");
      process.exit(1);
    }

    // Initialize database
    await initializeDatabase();
    console.log("Database initialized.");

    // Check if user already exists
    let user = await UserRepository.findByIrcAccount(ircAccount);
    
    if (user) {
      console.log(`User with IRC account '${ircAccount}' already exists.`);
      
      // If isAuthenticated flag is set, update it
      if (values.isAuthenticated) {
        user.isAuthenticated = true;
        await UserRepository.save(user);
        console.log(`User ${ircAccount} is now authenticated.`);
      }
      
    } else {
      // Create new user
      user = UserRepository.create({ 
        ircAccount,
        isAuthenticated: values.isAuthenticated || false
      });
      
      await UserRepository.save(user);
      console.log(`Added new user with IRC account '${ircAccount}'.`);
      
      if (values.isAuthenticated) {
        console.log(`User is authenticated.`);
      }
    }
    
    console.log("\nUser details:");
    console.log(`ID: ${user.id}`);
    console.log(`IRC Account: ${user.ircAccount}`);
    console.log(`Authenticated: ${user.isAuthenticated ? "yes" : "no"}`);
    
  } catch (error) {
    console.error("Error adding user:", error);
    process.exit(1);
  } finally {
    // Exit process
    process.exit(0);
  }
}

// Run the function
addUser(); 