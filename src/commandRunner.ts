import { type SandboxOptions, loadQuickJs } from "@sebastianwessel/quickjs"
import { CommandRepository } from "./database/repository/CommandRepository"

const { runSandboxed } = await loadQuickJs()

// the sandbox needs wrapped functions, so the docs claim
const wrap = (fn: Function) => (...args: any) => fn(...args)

export async function executeCode(code: string, params: object = {}): Promise<{ok: boolean, data: any}> {
  const execOptions: SandboxOptions = {
    allowFetch: true,
    allowFs: false,
    env: {
      CHXT: {
        log: wrap(console.log)
      },
      PARAMS: params
    }
  }
  
  // @ts-ignore
  const callback = async ({evalCode}) => evalCode(code)
  return await runSandboxed(callback, execOptions)
}

const dummyCode = `
  export default "meow from eval! " + env.PARAMS.argument
`

export interface CommandRunnerRunParams {
  name: string,
  argument: string,
}

export default class CommandRunner {
  async run({name, argument} : CommandRunnerRunParams): Promise<string> {
    // Look up the command by name in the database
    const command = await CommandRepository.findByName(name);
    
    if (!command) {
      throw new Error(`Command '${name}' not found`);
    }
    
    if (!command.isActive) {
      throw new Error(`Command '${name}' is disabled`);
    }
    
    // Execute the command using the code from the database
    return this.runScript(command.code, argument);
  }
  
  async runScript(code: string, argument: string): Promise<string> {
    try {
      console.log("Executing script with argument:", argument);
      
      // Wrap user code with our template
      const wrappedCode = `
// Original command code
${code}

// Execute command and export result
export default run(env.PARAMS.argument);
`;
      
      console.log("Final script code:", wrappedCode);
      
      const result = await executeCode(wrappedCode, { argument });
      console.log("QuickJS execution result:", result);
      
      if (!result.ok) {
        console.error("Script execution failed:", result);
        return `Error: ${result.data || "Unknown error"}`;
      }
      
      // Convert the result to a string if it's not already
      const stringResult = typeof result.data === 'string' 
        ? result.data 
        : JSON.stringify(result.data);
      
      console.log("Command result:", stringResult);
      return stringResult;
    } catch (error) {
      console.error("Error executing script:", error);
      return `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  }
}