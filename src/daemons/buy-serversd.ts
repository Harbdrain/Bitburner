export async function main(ns: NS) {
    ns.disableLog("ALL");

    let maxRam = ns.args[0] === undefined ? ns.getPurchasedServerMaxRam() : ns.args[0] as number;
    let servers = ns.getPurchasedServers();

    let cRam = 8;
    for (let server of servers) {
        cRam = Math.max(cRam, ns.getServerMaxRam(server));
    }

    ns.print(`INFO: cRam - ${cRam}. maxRam - ${maxRam}`)
    while (maxRam !== -1) {
        if (cRam >= maxRam) {
            cRam = maxRam;
            maxRam = -1;
        }
        for (let i = 0; i < ns.getPurchasedServerLimit(); i++) {
            let serverName = "pserv-" + i;

            if (servers.includes(serverName)) {
                if (ns.getServerMaxRam(serverName) >= cRam) {
                    continue;
                }
                while (ns.getPurchasedServerUpgradeCost(serverName, cRam) > ns.getServerMoneyAvailable("home")) {
                    await ns.sleep(1000);
                }
                ns.upgradePurchasedServer(serverName, cRam);
            } else {
                while (ns.getPurchasedServerCost(cRam) > ns.getServerMoneyAvailable("home")) {
                    await ns.sleep(1000);
                }
                ns.purchaseServer(serverName, cRam);
            }
        }
        servers = ns.getPurchasedServers();
        cRam *= 2;
        await ns.sleep(1000);
    }

    ns.toast("Bought all servers", "info", null);
}

