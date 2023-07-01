import Server from "/interface/server";
import Job from "/model/job";
import Network from "/model/network";
import { filterRunnableServers, getAllServers } from "/utils/server-utils";

const Scripts = { WEAKEN: "scripts/weaken.js", GROW: "scripts/grow.js", HACK: "scripts/hack.js" }

export async function main(ns: NS) {
    ns.disableLog("ALL");

    let servers = getAllServers(ns);
    let targetServer: Server;
    if (typeof ns.args[0] === "string") {
        targetServer = new Server(ns, ns.args[0]);
    } else {
        ns.tprint(`run ${ns.getScriptName()} <target hostname>`);
        return;
    }

    let delay = 100;
    let targetTime = Date.now() + 1000 + ns.getWeakenTime(targetServer.hostname);
    let i = 0;
    while (true) {
        if (!await prepareServer(ns, targetServer, servers)) {
            ns.print("INFO: done preparing server");
            targetTime = Date.now() + 1000 + ns.getWeakenTime(targetServer.hostname);
            i = 0;
        }

        let network = new Network(ns, filterRunnableServers(servers));
        let finalBatch: Job[] = [];

        let hackThreads = Math.floor(ns.hackAnalyzeThreads(targetServer.hostname, Math.floor(targetServer.money.max! * 0.5)));
        let weakenThreads1 = Math.ceil(hackThreads * 0.04);
        let growThreads = Math.ceil(ns.growthAnalyze(targetServer.hostname, 2));
        let weakenThreads2 = Math.ceil(growThreads * 0.08);
        let depth = Math.floor(ns.getWeakenTime(targetServer.hostname) / (4 * delay));

        ns.print(`INFO: depth = ${depth}`);
        for (; i < depth; i++) {
            let batch: Job[] = [];
            if (weakenThreads1 + weakenThreads2 > network.threads(ns.getScriptRam(Scripts.WEAKEN))) {
                break;
            }
            let job = new Job(ns);
            job.script = Scripts.WEAKEN;
            job.threads = weakenThreads1;
            job.args = [targetServer.hostname, targetTime + delay, ns.getWeakenTime(targetServer.hostname)];
            if (!network.assign(job)) {
                break;
            }
            batch.push(job);
            // batch = batch.concat(network.assignDividing(job));

            job = new Job(ns);
            job.script = Scripts.WEAKEN;
            job.threads = weakenThreads2;
            job.args = [targetServer.hostname, targetTime + delay * 3, ns.getWeakenTime(targetServer.hostname), true, ns.pid];
            if (!network.assign(job)) {
                break;
            }
            batch.push(job);
            // batch = batch.concat(network.assignDividing(job));

            job = new Job(ns);
            job.script = Scripts.HACK;
            job.threads = hackThreads;
            job.args = [targetServer.hostname, targetTime, ns.getHackTime(targetServer.hostname)];
            if (!network.assign(job)) {
                break;
            }
            batch.push(job);


            job = new Job(ns);
            job.script = Scripts.GROW;
            job.threads = growThreads;
            job.args = [targetServer.hostname, targetTime + delay * 2, ns.getGrowTime(targetServer.hostname)];
            if (!network.assign(job)) {
                break;
            }
            batch.push(job);

            finalBatch = finalBatch.concat(batch);
            targetTime += delay * 4;
        }

        if (finalBatch.length === 0) {
            ns.tprint("WARNING: batch is empty");
        }
        ns.print(`INFO: deploy batch (${finalBatch.length / 4})`);
        for (let job of finalBatch) {
            job.exec();
        }
        let port = ns.getPortHandle(ns.pid);
        port.clear();
        await port.nextWrite();
        i--;
    }
}

async function prepareServer(ns: NS, targetServer: Server, servers: Server[]) {
    if (!isPrepared(targetServer)) {
        ns.print("INFO: preparing server");
    } else {
        return true;
    }

    while (!isPrepared(targetServer)) {
        let network: Network = new Network(ns, filterRunnableServers(servers));
        if (network.threads(ns.getScriptRam(Scripts.WEAKEN)) === 0) {
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
        if (growThreads > 0 && growThreads + weakenThreads2 <= network.threads(scriptRam)) {
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

    return false;
}

function isPrepared(targetServer: Server) {
    return targetServer.money.current === targetServer.money.max && Math.abs(targetServer.security.min! - targetServer.security.current!) < 0.0001;
}

