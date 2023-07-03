import Player from "/interface/player";
import Server from "/interface/server";

export function getAllHostnames(ns: NS, current = "home", servers = new Array()) {
    if (servers.includes(current)) {
        return servers;
    }
    servers.push(current);

    let targets = ns.scan(current);
    for (let target of targets) {
        getAllHostnames(ns, target, servers);
    }

    return servers;
}

export function getAllServers(ns: NS) {
    return getAllHostnames(ns).map(hostname => new Server(ns, hostname));
}

export function getBestServers(ns: NS) {
    let servers = filterHackableServers(ns, getAllServers(ns));
    let player = new Player(ns);
    let data = servers.map(server => server.data);

    if (player.software.formulas) {
        data.forEach(d => d.hackDifficulty = d.minDifficulty);
        data.forEach(d => d.moneyAvailable = d.moneyMax);
        data.sort((a, b) => {
            let weithtA = a.moneyMax! * ns.formulas.hacking.hackChance(a, player.data) / ns.formulas.hacking.weakenTime(a, ns.getPlayer());
            let weithtB = b.moneyMax! * ns.formulas.hacking.hackChance(b, player.data) / ns.formulas.hacking.weakenTime(b, ns.getPlayer());
            return weithtB - weithtA;
        });

    } else {
        data.sort((a, b) => {
            let weithtA = a.moneyMax! * ns.hackAnalyzeChance(a.hostname) / ns.getWeakenTime(a.hostname);
            let weithtB = b.moneyMax! * ns.hackAnalyzeChance(b.hostname) / ns.getWeakenTime(b.hostname);
            return weithtB - weithtA;
        });
    }

    return data.map(d => new Server(ns, d.hostname));
}

export function filterRunnableServers(servers: Server[]) {
    return servers.filter(server => server.hasRoot && server.ram.max > 0);
}

export function filterHackableServers(ns: NS, servers: Server[]) {
    let player = new Player(ns);
    return servers.filter(server => server.hasRoot && !server.purchased && !server.isHome && server.hackLevel! <= player.hackLevel && server.money.max !== 0);
}
