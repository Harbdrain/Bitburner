import Server from "/interface/server";
import Job from "/model/job";
import { filterRunnableServers, getAllServers } from "/utils/server-utils";

const Scripts = { WEAKEN: "scripts/weaken.js", GROW: "scripts/grow.js", HACK: "scripts/hack.js" }

export async function main(ns: NS) {
    let targetServer = new Server(ns, ns.args[0] as string);
    while (true) {
        let runnableServers = filterRunnableServers(getAllServers(ns)).sort((a, b) => {
            if (a.hostname === "home") {
                return 1;
            } else if (b.hostname === "home") {
                return -1;
            }
            return a.ram.max - b.ram.max;
        });
        if (targetServer.security.current! > targetServer.security.min!) {
            let weakenJob = new Job(ns);
            weakenJob.script = Scripts.WEAKEN;
            weakenJob.threads = Math.ceil(targetServer.security.current! - targetServer.security.min!) * 20;
            weakenJob.args = [targetServer.hostname, 0];
            let jobs = assignDividing(ns, weakenJob, runnableServers);
            for (let job of jobs) {
                job.exec();
            }

            await ns.sleep(ns.getWeakenTime(targetServer.hostname) + 100);
        } else if (targetServer.money.current! < targetServer.money.max!) {
            let growJob = new Job(ns);
            growJob.script = Scripts.GROW;
            growJob.threads = Math.ceil(ns.growthAnalyze(targetServer.hostname, targetServer.money.max! / targetServer.money.current!));
            growJob.args = [targetServer.hostname, 0];
            let jobs = assignDividing(ns, growJob, runnableServers);
            for (let job of jobs) {
                job.exec();
            }

            await ns.sleep(ns.getGrowTime(targetServer.hostname) + 100);
        } else {
            let hackJob = new Job(ns);
            hackJob.script = Scripts.HACK;
            hackJob.threads = Math.floor(ns.hackAnalyzeThreads(targetServer.hostname, Math.floor(targetServer.money.current! * 0.5)));
            hackJob.args = [targetServer.hostname, 0];
            let jobs = assignDividing(ns, hackJob, runnableServers);
            for (let job of jobs) {
                job.exec();
            }

            await ns.sleep(ns.getHackTime(targetServer.hostname) + 100);
        }
    }
}

function assignDividing(ns: NS, job: Job, servers: Server[]) {
    let scriptRam = ns.getScriptRam(job.script);
    let jobThreads = job.threads;
    let jobs: Job[] = [];
    for (let server of servers) {
        if (server.threads(scriptRam).available > 0) {
            let threadsToRun = Math.min(server.threads(scriptRam).available, jobThreads);
            let dividedJob = new Job(ns);
            dividedJob.script = job.script;
            dividedJob.hostname = server.hostname;
            dividedJob.threads = threadsToRun;
            dividedJob.args = job.args;
            jobs.push(dividedJob);

            jobThreads -= threadsToRun;
            if (jobThreads <= 0) {
                break;
            }
        }
    }

    return jobs;
}
