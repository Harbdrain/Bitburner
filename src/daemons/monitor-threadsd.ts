import { filterRunnableServers, getAllServers } from "/utils/server-utils";

export async function main(ns: NS) {
    ns.disableLog("ALL");
    ns.tail();
    let servers = getAllServers(ns);
    let formatter = new Intl.NumberFormat();

    while (true) {
        let runnableServers = filterRunnableServers(servers);
        let maxThreads = 0;
        let usedThreads = 0;
        for (let server of runnableServers) {
            maxThreads += server.threads(1.75).max;
            usedThreads += server.threads(1.75).used;
        }

        const cyan = "\u001b[36m";
        ns.clearLog()
        ns.print("\n".repeat(10) + cyan + "Threads: " + formatter.format(usedThreads) + "/" + formatter.format(maxThreads));
        await ns.sleep(500);
    }
}

