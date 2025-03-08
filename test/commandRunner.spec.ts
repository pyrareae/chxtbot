import 'chai/register-should';
import CommandRunner, {executeCode} from "../src/commandRunner";

describe("executeCode", () => {
  const exampleCode = `
    const meowAt = name => "meow " + name + "!"
    export default meowAt(env.PARAMS.name)
  `
  it("should execute code", async () => {
    const {data} = await executeCode(exampleCode, {name: "world"})
    data.should.equal("meow world!")
  })
})