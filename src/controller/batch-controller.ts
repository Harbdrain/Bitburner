import Player from "/interface/player";
import Server from "/interface/server";
import Job from "/model/job";
import Network from "/model/network";
import { Deque } from "/utils/deque";
import { filterRunnableServers, getAllServers, getBestServers } from "/utils/server-utils";

const Scripts = { WEAKEN: "scripts/weaken.js", GROW: "scripts/grow.js", HACK: "scripts/hack.js" }

class Batcher {
    private readonly ns: NS;
    private readonly targetServer: Server;
    private batch: Deque<Job>;
    private network: Network;
    private runningJobs: Map<number, Job>;

    private properties = {
        maxDepth: 0,
        time: {
            end: 0,
            delta: 0,
        },
        threads: {
            hack: 0,
            weaken: 0,
            grow: 0,
            weaken2: 0
        }
    }

    constructor(ns: NS, targetServer: Server, maxDepth: number, delta: number, percentMoneyToSteal: number) {
        this.ns = ns;
        this.targetServer = targetServer;
        this.batch = new Deque<Job>();
        this.network = new Network(ns, filterRunnableServers(getAllServers(ns)));
        this.runningJobs = new Map();
        this.properties.maxDepth = maxDepth;
        this.properties.time.delta = delta;

        this.properties.threads.hack = Math.floor(this.ns.hackAnalyzeThreads(this.targetServer.hostname, Math.floor(this.targetServer.money.max! * percentMoneyToSteal)));
        this.properties.threads.weaken = Math.ceil(this.properties.threads.hack * 0.04);
        this.properties.threads.grow = Math.ceil(this.ns.growthAnalyze(this.targetServer.hostname, 1 / (1 - percentMoneyToSteal)));
        this.properties.threads.weaken2 = Math.ceil(this.properties.threads.grow * 0.08);
        this.properties.time.end = Date.now();
    }

    schedule(depth = this.properties.maxDepth) {
        let actions = [
            {
                script: Scripts.HACK,
                threads: this.properties.threads.hack,
                type: "hack-"
            },
            {
                script: Scripts.WEAKEN,
                threads: this.properties.threads.weaken,
                type: "weaken-"
            },
            {
                script: Scripts.GROW,
                threads: this.properties.threads.grow,
                type: "grow-"
            },
            {
                script: Scripts.WEAKEN,
                threads: this.properties.threads.weaken2,
                type: "weaken2-"
            }]

        for (let i = 0; i < depth; i++) {
            for (let action of actions) {
                let job = new Job(this.ns);
                job.script = action.script;
                job.threads = action.threads;
                job.args = [this.targetServer.hostname, this.properties.time.end, this.ns.pid, action.type];
                if (!this.network.assign(job)) {
                    break;
                }
                this.batch.pushBack(job);
                this.properties.time.end += this.properties.time.delta;
            }
        }

        while (this.batch.length % 4 !== 0) {
            let job = this.batch.popBack() as Job;
            this.network.finish(job);
        }
    }

    async deploy() {
        let delay = 0;
        while (!this.batch.isEmpty()) {
            let job = this.batch.popFront() as Job;
            job.args[1] = job.args[1] as number + delay;
            let pid = job.exec() as number;
            this.runningJobs.set(pid, job);
            let port = this.ns.getPortHandle(pid);
            await port.nextWrite();
            let result = +port.read();
            delay += Math.ceil(result);
            await this.ns.sleep(0);
        }
        this.properties.time.end += delay;
    }

    async run() {
        let player = new Player(this.ns);
        let level = player.hackLevel;
        let port = this.ns.getPortHandle(this.ns.pid);
        port.clear();
        let desync = false;

        this.schedule();
        await this.deploy();
        while (this.runningJobs.size !== 0) {
            while (port.empty()) {
                await port.nextWrite();
            }
            let result = (port.read() as string).split('-');
            // this.ns.write("log.txt", `${desync} ${result[0]}-${result[1]}\n`, "a");
            this.network.finish(this.runningJobs.get(+result[1]) as Job);
            this.runningJobs.delete(+result[1]);
            if (!desync && result[0] === "weaken2") {
                if (player.hackLevel > level + 5) {
                    this.ns.print("INFO: desync");
                    desync = true;
                    continue;
                }
                this.schedule(1);
                await this.deploy();
            }
        }
    }
}

export async function main(ns: NS) {
    ns.clearLog();
    ns.disableLog("ALL");
    let delta = 100;
    let percent = 0.95;

    while (true) {
        let targetServer = getBestServers(ns)[0];
        ns.print(`INFO: targeting ${targetServer.hostname}`);
        await prepareServer(ns, targetServer);
        let depth = Math.ceil(ns.getWeakenTime(targetServer.hostname) / (4 * delta));
        let batcher = new Batcher(ns, targetServer, depth, delta, percent);
        await batcher.run();
    }
}

async function prepareServer(ns: NS, targetServer: Server, servers: Server[] = getAllServers(ns)) {
    if (!isPrepared(targetServer)) {
        ns.print(`INFO: preparing server\nSecurity: ${targetServer.security.min}/${targetServer.security.current}\nMoney:    ${ns.formatNumber(targetServer.money.current!, 3, 1000, true)}/${ns.formatNumber(targetServer.money.max!, 3, 1000, true)}`);
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
            job.args = [targetServer.hostname, targetTime];
            batch = batch.concat(network.assignDividing(job));
        }

        let scriptRam = Math.max(ns.getScriptRam(Scripts.GROW), ns.getScriptRam(Scripts.WEAKEN))
        if (growThreads > 0 && growThreads + weakenThreads2 <= network.threads(scriptRam)) {
            let job = new Job(ns);
            job.script = Scripts.GROW;
            job.threads = growThreads;
            job.args = [targetServer.hostname, targetTime + 20];
            if (network.assign(job)) {
                batch.push(job);

                job = new Job(ns);
                job.script = Scripts.WEAKEN;
                job.threads = weakenThreads2;
                job.args = [targetServer.hostname, targetTime + 40];
                batch = batch.concat(network.assignDividing(job));
            }
        }

        for (let job of batch) {
            job.exec();
        }

        await ns.sleep(targetTime + 60 - Date.now());
    }

    ns.print("INFO: done preparing server");
    return false;
}

function isPrepared(targetServer: Server) {
    return targetServer.money.current === targetServer.money.max && Math.abs(targetServer.security.min! - targetServer.security.current!) < 0.0001;
}

