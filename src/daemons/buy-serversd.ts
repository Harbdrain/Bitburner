export async function main(ns: NS) {
    let maxRam = ns.args[0] === undefined ? 1024 : ns.args[0] as number;
    if (maxRam === -1) {
        maxRam = Infinity;
    }
    let servers = ns.getPurchasedServers();

    let cRam = 8;
    for (let server of servers) {
        cRam = Math.max(cRam, ns.getServerMaxRam(server));
    }

    while (maxRam !== -1) {
        if (cRam >= maxRam) {
            cRam = maxRam;
            maxRam = -1;
        }
        for (let i = 0; i < ns.getPurchasedServerLimit(); i++) {
            let serverName = "pserv-" + i;
            while (ns.getPurchasedServerCost(cRam) > ns.getServerMoneyAvailable("home")) {
                await ns.sleep(1000);
            }
            if (servers.includes(serverName)) {
                if (ns.getServerMaxRam(serverName) < cRam) {
                    ns.killall(serverName);
                    ns.deleteServer(serverName);
                } else {
                    continue;
                }
            }
            ns.purchaseServer(serverName, cRam);
            ns.toast("Bought new Server: " + serverName + ": " + ns.formatRam(cRam), "info", 5000);
        }
        servers = ns.getPurchasedServers();
        cRam *= 2;
        await ns.sleep(1000);
    }

    ns.toast("Bought all servers", "info", null);
}

