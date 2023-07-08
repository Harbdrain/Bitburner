import Server from "/interface/server";

export async function main(ns: NS) {
    ns.disableLog("ALL");
    ns.tail();

    if (ns.args[0] === undefined) {
        ns.tprint(`ERROR: Usage: run ${ns.getScriptName()} <server>`);
        return;
    }
    let server = new Server(ns, ns.args[0] as string);

    while (true) {
        let rows = new Array();
        rows.push(`${server.hostname}: Money    - ${ns.formatNumber(server.money.current!, 3, 1000, true)}/${ns.formatNumber(server.money.max!, 3, 1000, true)}`);
        rows.push(`${server.hostname}: Security - ${server.security.min}/${Math.round(server.security.current! * 100) / 100}`);
        rows.push(`${server.hostname}: Hack     - ${ns.tFormat(ns.getHackTime(server.hostname))} (t=${Math.ceil(ns.hackAnalyzeThreads(server.hostname, server.money.current! - server.money.max! * 0.5))})`);
        rows.push(`${server.hostname}: Grow     - ${ns.tFormat(ns.getGrowTime(server.hostname))} (t=${Math.ceil(ns.growthAnalyze(server.hostname, server.money.max! / (server.money.current! === 0 ? 1 : server.money.current!)))})`);
        rows.push(`${server.hostname}: Weaken   - ${ns.tFormat(ns.getWeakenTime(server.hostname))} (t=${Math.ceil((server.security.current! - server.security.min!) * 20)})`);
        let maxLength = rows.reduce((acc, row) => Math.max(acc, row.length), 0);
        let border = "=".repeat(maxLength);
        rows = [border].concat(rows).concat([border]);
        let s = rows.reduce((acc, row) => acc + "\n" + row, "\u001b[36m");
        ns.clearLog();
        ns.print(s);
        await ns.sleep(500);
    }
}

