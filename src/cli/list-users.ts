#!/usr/bin/env bun
import { initializeDatabase, UserRepository } from "../database";

async function listUsers() {
  try {
    // Initialize database
    await initializeDatabase();
    console.log("Database initialized.");

    // Get all users
    const users = await UserRepository.find({
      order: {
        id: "ASC",
      },
    });

    if (users.length === 0) {
      console.log("No users found in the database.");
      return;
    }

    console.log(`Found ${users.length} users:`);
    console.log("-------------------------------------------");
    console.log("ID | IRC Account           | Authenticated");
    console.log("-------------------------------------------");

    for (const user of users) {
      const id = user.id.toString().padEnd(3);
      const ircAccount = (user.ircAccount || "").padEnd(20);
      const auth = user.isAuthenticated ? "Yes" : "No";
      
      console.log(`${id}| ${ircAccount} | ${auth}`);
    }
    
    console.log("-------------------------------------------");

  } catch (error) {
    console.error("Error listing users:", error);
    process.exit(1);
  } finally {
    // Exit process
    process.exit(0);
  }
}

// Run the function
listUsers(); 