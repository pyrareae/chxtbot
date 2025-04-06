import toml from "toml"
import { readFile } from 'node:fs/promises'
import { pipe, omit, map } from "ramda"

export class ConnectionDetails {
  nick: String = 'chxtbot';
  username: String = 'chxtbox';
  encoding: String = "utf8";
  version: String = "Ch×tBo× unstable";
  account: String | null = null;
  password: String | null = null;
}
export class Server extends ConnectionDetails {
  host: String = '';
  port: Number = 6697;
  channels: String[] = [];
  commandPrefix: String = "!!";
  constructor(params: Server) {
    super()
    Object.assign(this, params)
  }
}

// Define APIKeys interface
export interface APIKeys {
  gemini: string;
  [key: string]: string;
}

export class Config extends ConnectionDetails {
  servers: Server[] = [];
  api_keys: APIKeys = { gemini: '' };
  
  constructor(params: Config) {
    super()
    Object.assign(this, params)
  }
}

function formatServerData(serverList: object) : object {
  const merged = pipe(
    omit(['default']),
    Object.values,
    map(el =>( {...serverList.default, ...el}))
  )(serverList)
  return merged
}

async function readConfig(): Promise<Config> {
  const data = await readFile(new URL("../config.toml", import.meta.url))
    .then(buff => toml.parse(buff.toString('utf8')))
  
  // Format server data
  data.servers = formatServerData(data.servers).map(def => new Server(def))
  
  // Ensure api_keys is defined
  if (!data.api_keys) {
    data.api_keys = { gemini: '' };
    console.warn("Warning: No API keys found in config.toml");
  } else {
    console.log("API keys loaded from config.toml:", Object.keys(data.api_keys));
  }
  
  return new Config(data)
}

const config = await readConfig()

export default config

export const reloadConfig = async () => {
  const newconf = await readConfig()
  Object.keys(config).forEach((key: String) => delete config[(key as keyof Config)])
  Object.assign(config, newconf)
}