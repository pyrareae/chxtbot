#!/usr/bin/env bun
import { initializeDatabase, UserRepository } from "../database";
import { parseArgs } from "util";

async function addUser() {
  try {
    // Parse command line arguments
    const options = {
      ircIdentifier: { type: "string" as const, short: "i" },
      hostmask: { type: "string" as const, short: "h" },
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
    const ircIdentifier = values.ircIdentifier || positionals[0];
    if (!ircIdentifier) {
      console.error("Error: IRC identifier is required.");
      console.log("Usage: bun run src/cli/add-user.ts -i <ircIdentifier> [-h <hostmask>] [-a]");
      console.log("   or: bun run src/cli/add-user.ts <ircIdentifier> [<hostmask>]");
      process.exit(1);
    }

    // Initialize database
    await initializeDatabase();
    console.log("Database initialized.");

    // Check if user already exists
    let user = await UserRepository.findByIrcIdentifier(ircIdentifier);
    
    if (user) {
      console.log(`User with IRC identifier '${ircIdentifier}' already exists.`);
      
      // If hostmask is provided, update it
      const hostmask = values.hostmask || positionals[1];
      if (hostmask) {
        await UserRepository.updateHostmask(user, hostmask);
        console.log(`Updated hostmask to '${hostmask}'`);
      }
      
      // If isAuthenticated flag is set, update it
      if (values.isAuthenticated) {
        user.isAuthenticated = true;
        await UserRepository.save(user);
        console.log(`User ${ircIdentifier} is now authenticated.`);
      }
      
    } else {
      // Create new user
      user = UserRepository.create({ 
        ircIdentifier,
        hostmask: values.hostmask || positionals[1] || null,
        isAuthenticated: values.isAuthenticated || false
      });
      
      await UserRepository.save(user);
      console.log(`Added new user with IRC identifier '${ircIdentifier}'.`);
      
      if (values.hostmask || positionals[1]) {
        console.log(`Set hostmask to '${values.hostmask || positionals[1]}'`);
      }
      
      if (values.isAuthenticated) {
        console.log(`User is authenticated.`);
      }
    }
    
    console.log("\nUser details:");
    console.log(`ID: ${user.id}`);
    console.log(`IRC Identifier: ${user.ircIdentifier}`);
    console.log(`Hostmask: ${user.hostmask || "not set"}`);
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