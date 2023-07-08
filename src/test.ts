export async function main(ns: NS) {
    let servers = ns.getPurchasedServers();
    ns.tprint(ns.formatRam(ns.getServerMaxRam(servers[23])))
}
