import { initializeDatabase, UserRepository, CommandRepository } from "./src/database";

async function seedCommands() {
  try {
    console.log("Initializing database...");
    await initializeDatabase();
    
    // Create a default user if none exists
    console.log("Creating default user...");
    const user = await UserRepository.findOrCreate("default");
    
    // Create some sample commands
    console.log("Creating sample commands...");
    
    // Helper command
    const helpCommand = await CommandRepository.createCommand(
      user,
      "help",
      `// A simple help command that lists available commands
function run(arg) {
  return "Available commands: help, echo, time";
}`
    );
    console.log(`Created command: ${helpCommand.name}`);
    
    // Echo command
    const echoCommand = await CommandRepository.createCommand(
      user,
      "echo",
      `// A simple echo command that returns whatever was sent
function run(arg) {
  return arg || "You didn't say anything!";
}`
    );
    console.log(`Created command: ${echoCommand.name}`);
    
    // Time command
    const timeCommand = await CommandRepository.createCommand(
      user,
      "time",
      `// A command that returns the current time
function run(arg) {
  const now = new Date();
  return \`Current time: \${now.toLocaleTimeString()}\`;
}`
    );
    console.log(`Created command: ${timeCommand.name}`);
    
    console.log("Seed completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding commands:", error);
    process.exit(1);
  }
}

// Run the seed function
seedCommands(); 