import ChxtIrc from "./irc"
import config, { Server } from "./config"
import { pipe, map } from "ramda"

console.log(config)

export const connections = []

export const main = {
  // connections: [],
  start() {
    for (let server of config.servers) {
      connections.push(new ChxtIrc(server))
    }
  },
}
