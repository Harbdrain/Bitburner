import { getBestServers } from "/utils/server-utils";

export async function main(ns: NS) {
    let servers = getBestServers(ns);

    for (let server of servers) {
        let maxMoney = ns.formatNumber(server.money.max!, 3, 1000, true);
        ns.tprint("INFO: " + server.hostname + " - " + maxMoney);
    }
}

