import { filterHackableServers, getAllServers } from "/utils/server-utils";

export async function main(ns: NS) {
    let servers = filterHackableServers(ns, getAllServers(ns));
    servers.sort((a, b) => {
        let weithtA = a.money.max! * ns.hackAnalyzeChance(a.hostname) / ns.getWeakenTime(a.hostname);
        let weithtB = b.money.max! * ns.hackAnalyzeChance(b.hostname) / ns.getWeakenTime(b.hostname);
        return weithtB - weithtA;
    });
    for (let server of servers) {
        let maxMoney = ns.formatNumber(server.money.max!, 3, 1000, true);
        ns.tprint("INFO: " + server.hostname + " - " + maxMoney);
    }
}
