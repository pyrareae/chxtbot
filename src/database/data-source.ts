import "reflect-metadata";
import { DataSource } from "typeorm";
import path from "path";

// Initialize database connection
export const AppDataSource = new DataSource({
  type: "sqlite",
  database: path.join(process.cwd(), "chxt.db", "database.sqlite"),
  synchronize: true, // Automatically creates database schema based on entities
  logging: process.env.NODE_ENV !== "production",
  entities: [
    path.join(__dirname, "entity", "*.ts")
  ],
  migrations: [],
  subscribers: [],
});

// Initialize database connection
export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Database connection has been established successfully.");
    return AppDataSource;
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    throw error;
  }
}; 