import { getBestServers } from "/utils/server-utils";

export async function main(ns: NS) {
    while (true) {
        let servers = getBestServers(ns).sort((a, b) => b.money.max! - a.money.max!);
        for (let server of servers) {
            if (!ns.getRunningScript("controller/simple-controller.js", "home", server.hostname)) {
                ns.exec("controller/simple-controller.js", "home", 1, server.hostname);
            }
        }
        await ns.sleep(60000);
    }
}
