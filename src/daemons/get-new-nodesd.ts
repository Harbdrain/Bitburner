import Player from "/interface/player";
import Server from "/interface/server";
import { getAllServers } from "/utils/server-utils";

export async function main(ns: NS) {
    let servers = getAllServers(ns);
    let player = new Player(ns);
    while (true) {
        let targets = servers.filter(server => !server.hasRoot && server.ports.required! <= player.ports);
        for (let target of targets) {
            penetrate(ns, target, player);
            ns.nuke(target.hostname);
            ns.toast("Got Root access to " + target.hostname, "info", 5000);
        }

        let hasRootServers = servers.filter(server => server.hasRoot);
        if (hasRootServers.length === servers.length) {
            return;
        }
        await ns.sleep(60000);
    }
}

function penetrate(ns: NS, target: Server, player: Player) {
    if (player.software.ssh && !target.ports.ssh) {
        ns.brutessh(target.hostname);
    }
    if (player.software.ftp && !target.ports.ftp) {
        ns.ftpcrack(target.hostname);
    }
    if (player.software.smtp && !target.ports.smtp) {
        ns.relaysmtp(target.hostname);
    }
    if (player.software.http && !target.ports.http) {
        ns.httpworm(target.hostname);
    }
    if (player.software.sql && !target.ports.sql) {
        ns.sqlinject(target.hostname);
    }
}
