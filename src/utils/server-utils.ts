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

export function filterRunnableServers(servers: Server[]) {
    return servers.filter(server => server.hasRoot);
}

export function filterHackableServers(ns: NS, servers: Server[]) {
    let player = new Player(ns);
    return servers.filter(server => server.hasRoot && !server.purchased && !server.isHome && server.hackLevel! <= player.hackLevel && server.money.max !== 0);
}
