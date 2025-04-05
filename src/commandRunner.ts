import { type SandboxOptions, loadQuickJs } from "@sebastianwessel/quickjs"

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
  async run({name, argument} : CommandRunnerRunParams) {
    return executeCode(dummyCode, {argument})
  }
  
  async runScript(code: string, argument: string): Promise<string> {
    try {
      const result = await executeCode(code, { argument });
      if (!result.ok) {
        throw new Error("Script execution failed");
      }
      return result.data;
    } catch (error) {
      console.error("Error executing script:", error);
      throw error;
    }
  }
}