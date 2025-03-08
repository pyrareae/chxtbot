import { type SandboxOptions, loadQuickJs } from "@sebastianwessel/quickjs"

const { runSandboxed } = await loadQuickJs()

// the sandbox needs wrapped functions, so the docs claim
const wrap = (fn: Function) => (...args: any) => fn(...args)

export async function executeCode(code: String, params: object = {}): Promise<{ok: boolean, data: any}> {
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
  name: String,
  argument: String,
}
export default class CommandRunner {
  async run({name, argument} : CommandRunnerRunParams) {
    return executeCode(dummyCode, {argument})
  }
}