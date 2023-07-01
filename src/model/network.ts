import Server from "interface/server";
import Job from "model/job";
import Node from "model/node";

export default class Network {
    ns: NS;
    nodes: Node[] = [];
    ram = {
        max: 0,
        used: 0,
        available: 0
    };

    constructor(ns: NS, servers: Server[]) {
        this.ns = ns;
        for (let server of servers) {
            let node = new Node(server);
            this.nodes.push(node);
            this.ram.max += node.ram.max;
            this.ram.used += node.ram.used;
            this.ram.available += node.ram.available;
        }
        this.nodes.sort((a, b) => {
            if (a.hostname === "home") {
                return 1;
            } else if (b.hostname === "home") {
                return -1;
            }
            return a.ram.max - b.ram.max}
        );
    }

    threads(scriptRam: number) {
        let available = 0;
        for (let node of this.nodes) {
            available += node.threads(scriptRam);
        }

        return available;
    }

    assign(job: Job) {
        let scriptRam = this.ns.getScriptRam(job.script);

        for (let node of this.nodes) {
            if (job.threads <= node.threads(scriptRam)) {
                job.hostname = node.hostname;
                node.ram.used += job.threads * scriptRam;
                node.ram.available = node.ram.max - node.ram.used;
                this.ram.used += job.threads * scriptRam;
                this.ram.available = this.ram.max - this.ram.used;
                return true;
            }
        }

        return false;
    }

    assignDividing(job: Job) {
        let scriptRam = this.ns.getScriptRam(job.script);
        let jobThreads = job.threads;
        let jobs: Job[] = [];
        for (let node of this.nodes) {
            if (node.threads(scriptRam)> 0) {
                let threadsToRun = Math.min(node.threads(scriptRam), jobThreads);
                let dividedJob = new Job(this.ns);
                dividedJob.script = job.script;
                dividedJob.hostname = node.hostname;
                dividedJob.threads = threadsToRun;
                dividedJob.args = job.args;
                jobs.push(dividedJob);

                node.ram.used += threadsToRun * scriptRam;
                node.ram.available = node.ram.max - node.ram.used;
                this.ram.used += threadsToRun * scriptRam;
                this.ram.available = this.ram.max - this.ram.used;

                jobThreads -= threadsToRun;
                if (jobThreads <= 0) {
                    break;
                }
            }
        }

        return jobs;
    }
}

