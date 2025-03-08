import toml from "toml"
import { readFile } from 'node:fs/promises';

interface ConnectionDetails {
  nick: String,
  // todo auth creds
}
interface Server extends ConnectionDetails {
  host: String,
  port: Number,
  channels: String[]
}
interface Config extends ConnectionDetails {
  servers: Server[]
}

async function readConfig(): Promise<Config> {
  const data = await readFile(new URL("../config.toml", import.meta.url))
  return toml.parse(data.toString('utf8'))
}

const config = await readConfig()

export default config

export const reloadConfig = async () => {
  const newconf = await readConfig()
  Object.keys(config).forEach((key: String) => delete config[(key as keyof Config)])
  Object.assign(config, newconf)
}