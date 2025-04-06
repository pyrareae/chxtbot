import { AppDataSource } from "./data-source";
import { User } from "./entity/User";
import { Command } from "./entity/Command";
import { UserRepository } from "./repository/UserRepository";
import { CommandRepository } from "./repository/CommandRepository";
import { addDescriptionColumn } from "./migration/add-description";
import { updateUserFields } from "./migration/update-user-fields";

/**
 * Initialize the database connection and run necessary migrations
 */
export async function initializeDatabase() {
  try {
    await AppDataSource.initialize();
    console.log("Database connection has been established successfully.");
    
    // Run migrations
    await addDescriptionColumn();
    await updateUserFields();
    
    return true;
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    throw error;
  }
}

// Export entities and repositories
export {
  AppDataSource,
  // Entities
  User,
  Command,
  // Repositories
  UserRepository,
  CommandRepository
}; 