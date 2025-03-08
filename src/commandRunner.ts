import { type SandboxOptions, loadQuickJs } from "@sebastianwessel/quickjs"

// the sandbox needs wrapped functions, so the docs claim
const wrap = (fn: Function) => (...args: any) => fn(...args)

const execOptions: SandboxOptions = {
  allowFetch: true,
  allowFs: false,
  env: {
    CHXT: {
      log: wrap(console.log)
    }
  }
}

export function executeCode(code: String) {

}

export default class CommandRunner {
  constructor() {

  }
}