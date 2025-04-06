import { AppDataSource } from "../data-source";

export async function updateUserFields() {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  
  try {
    // Check if columns already exist
    const table = await queryRunner.getTable("user");
    
    // If the new ircAccount column doesn't exist yet
    if (!table.findColumnByName("ircAccount")) {
      // First add the new column
      await queryRunner.query("ALTER TABLE user ADD COLUMN ircAccount TEXT");
      console.log("Added 'ircAccount' column to user table");
      
      // Update existing data to copy ircIdentifier to ircAccount
      if (table.findColumnByName("ircIdentifier")) {
        await queryRunner.query("UPDATE user SET ircAccount = ircIdentifier");
        console.log("Copied data from 'ircIdentifier' to 'ircAccount'");
      }
      
      // Create index for uniqueness
      await queryRunner.query("CREATE UNIQUE INDEX idx_user_irc_account ON user (ircAccount)");
    }
    
    // Remove old columns if they exist
    if (table.findColumnByName("ircIdentifier")) {
      await queryRunner.query("ALTER TABLE user DROP COLUMN ircIdentifier");
      console.log("Dropped 'ircIdentifier' column from user table");
    }
    
    if (table.findColumnByName("hostmask")) {
      await queryRunner.query("ALTER TABLE user DROP COLUMN hostmask");
      console.log("Dropped 'hostmask' column from user table");
    }
    
    // Add authToken column if it doesn't exist
    if (!table.findColumnByName("authToken")) {
      await queryRunner.query("ALTER TABLE user ADD COLUMN authToken TEXT");
      console.log("Added 'authToken' column to user table");
    }
    
    // Add authTokenExpiry column if it doesn't exist
    if (!table.findColumnByName("authTokenExpiry")) {
      await queryRunner.query("ALTER TABLE user ADD COLUMN authTokenExpiry DATETIME");
      console.log("Added 'authTokenExpiry' column to user table");
    }
    
    // Add isAuthenticated column if it doesn't exist
    if (!table.findColumnByName("isAuthenticated")) {
      await queryRunner.query("ALTER TABLE user ADD COLUMN isAuthenticated BOOLEAN DEFAULT 0");
      console.log("Added 'isAuthenticated' column to user table");
    }
    
    // Add createdAt and updatedAt columns if they don't exist
    if (!table.findColumnByName("createdAt")) {
      await queryRunner.query("ALTER TABLE user ADD COLUMN createdAt DATETIME DEFAULT CURRENT_TIMESTAMP");
      console.log("Added 'createdAt' column to user table");
    }
    
    if (!table.findColumnByName("updatedAt")) {
      await queryRunner.query("ALTER TABLE user ADD COLUMN updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP");
      console.log("Added 'updatedAt' column to user table");
    }
    
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  } finally {
    await queryRunner.release();
  }
} 