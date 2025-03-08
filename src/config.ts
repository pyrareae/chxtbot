import toml from "toml"
import { readFile } from 'node:fs/promises';

interface Config {
  channels: String[]

}

async function readConfig(): Promise<Config> {
  const data = await readFile(new URL("../config.toml", import.meta.url))
  return toml.parse(data.toString('utf8'))
}
const config = await readConfig()

export default config

export const reloadConfig = () => {

}