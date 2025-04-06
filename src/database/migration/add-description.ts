import { AppDataSource } from "../data-source";

/**
 * Migration to add the description column to the command table
 */
export async function addDescriptionColumn() {
  try {
    console.log("Starting migration: add description column to command table");
    
    // Get the database connection
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    
    // Check if the column already exists
    const table = await queryRunner.getTable("command");
    const descriptionColumn = table?.findColumnByName("description");
    
    if (!descriptionColumn) {
      console.log("Description column does not exist, adding it...");
      
      // Add the description column
      await queryRunner.query(
        `ALTER TABLE "command" ADD COLUMN "description" text NULL`
      );
      
      console.log("Description column added successfully");
    } else {
      console.log("Description column already exists, skipping migration");
    }
    
    // Release the query runner
    await queryRunner.release();
    
    console.log("Migration completed successfully");
    return true;
  } catch (error) {
    console.error("Migration failed:", error);
    return false;
  }
} 