import Server from "/interface/server";
import Job from "/model/job";
import Network from "/model/network";
import { filterRunnableServers, getAllServers } from "/utils/server-utils";

const Scripts = { WEAKEN: "scripts/weaken.js", GROW: "scripts/grow.js", HACK: "scripts/hack.js" }
var servers: Server[];

export async function main(ns: NS) {
    servers = getAllServers(ns);
    let targetServer: Server;
    if (typeof ns.args[0] === "string") {
        targetServer = new Server(ns, ns.args[0]);
    } else {
        ns.tprint(`run ${ns.getScriptName()} <target hostname>`);
        return;
    }

    await prepareServer(ns, targetServer);
    ns.tprint("INFO: done preparing server");
}

async function prepareServer(ns: NS, targetServer: Server) {
    while (!isPrepared(targetServer)) {
        let network: Network = new Network(ns, filterRunnableServers(servers));
        if (network.threads(ns.getScriptRam(Scripts.WEAKEN)).available === 0) {
            ns.tprint("ERROR: Do not have threads to prepare server. Killing the controller");
            ns.kill(ns.pid);
        }
        let batch: Job[] = [];

        let weakenThreads1: number = 0;
        let growThreads: number = 0;
        let weakenThreads2: number = 0;

        if (targetServer.security.current! > targetServer.security.min!) {
            weakenThreads1 += Math.ceil((targetServer.security.current! - targetServer.security.min!) * 20);
        }
        if (targetServer.money.current! < targetServer.money.max!) {
            growThreads += Math.ceil(ns.growthAnalyze(targetServer.hostname,
                targetServer.money.max! / targetServer.money.current!));
            weakenThreads2 += Math.ceil(growThreads * 0.08);
        }

        let targetTime = Date.now() + ns.getWeakenTime(targetServer.hostname) + 1000;
        if (weakenThreads1 > 0) {
            let job = new Job(ns);
            job.script = Scripts.WEAKEN;
            job.threads = weakenThreads1;
            job.args = [targetServer.hostname, targetTime, ns.getWeakenTime(targetServer.hostname)];
            batch = batch.concat(network.assignDividing(job));
        }

        let scriptRam = Math.max(ns.getScriptRam(Scripts.GROW), ns.getScriptRam(Scripts.WEAKEN))
        if (growThreads > 0 && growThreads + weakenThreads2 <= network.threads(scriptRam).available) {
            let job = new Job(ns);
            job.script = Scripts.GROW;
            job.threads = growThreads;
            job.args = [targetServer.hostname, targetTime + 20, ns.getGrowTime(targetServer.hostname)];
            if (network.assign(job)) {
                batch.push(job);

                job = new Job(ns);
                job.script = Scripts.WEAKEN;
                job.threads = weakenThreads2;
                job.args = [targetServer.hostname, targetTime + 40, ns.getWeakenTime(targetServer.hostname)];
                batch = batch.concat(network.assignDividing(job));
            }
        }

        for (let job of batch) {
            job.exec();
        }

        await ns.sleep(targetTime + 60 - Date.now());
    }
}

function isPrepared(targetServer: Server) {
    return targetServer.money.current === targetServer.money.max && Math.abs(targetServer.security.min! - targetServer.security.current!) < 0.0001;
}

