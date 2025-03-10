import * as chxt from "./chxt"
import REPL from "repl"

const repl = REPL.start()
Object.assign(repl.context, chxt)