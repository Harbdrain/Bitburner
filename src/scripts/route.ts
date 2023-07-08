function recursiveScan(ns: NS, parent: string, server: string, target: string, route: string[]) {
    const children = ns.scan(server);
    for (let child of children) {
        if (parent == child) {
            continue;
        }
        if (child == target) {
            route.unshift(child);
            route.unshift(server);
            return true;
        }

        if (recursiveScan(ns, server, child, target, route)) {
            route.unshift(server);
            return true;
        }
    }
    return false;
}

export async function main(ns: NS) {
    const args = ns.flags([["help", false]]) as {[key: string]: string[]};
    let route: string[] = [];
    let server = args._[0];
    if (!server || args.help) {
        ns.tprint("This script helps you find a server on the network and shows you the path to get to it.");
        ns.tprint(`Usage: run ${ns.getScriptName()} SERVER`);
        ns.tprint("Example:");
        ns.tprint(`> run ${ns.getScriptName()} n00dles`);
        return;
    }

    recursiveScan(ns, '', 'home', server, route);
    let s = "";
    for (let i = 1; i < route.length; i++) {
        s += `connect ${route[i]}; `;
    }
    s += 'backdoor'
    s = "\n\u001b[36m" + s;
    ns.tprint(s);
}
