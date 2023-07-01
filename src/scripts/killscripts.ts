import { getAllHostnames } from "/utils/server-utils"

export async function main(ns: NS) {
    let servers = getAllHostnames(ns);
    servers = servers.filter(server => server !== "home");
    for (let server of servers) {
        ns.killall(server);
    }
}
