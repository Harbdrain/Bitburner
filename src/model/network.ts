import Server from "interface/server";
import Job from "model/job";
import Node from "model/node";

export default class Network {
    private _ns: NS;
    private _nodes: Node[] = [];
    private _ram = {
        max: 0,
        used: 0,
        available: 0
    };

    constructor(ns: NS, servers: Server[]) {
        this._ns = ns;
        for (let server of servers) {
            let node = new Node(server);
            this._nodes.push(node);
            this._ram.max += server.ram.max;
            this._ram.used += server.ram.used;
            this._ram.available += server.ram.available;
        }
        this._nodes.sort((a, b) => a.ram.max - b.ram.max);
    }
    get ram() { return this._ram; }

    threads(scriptRam: number) {
        let max = 0;
        let available = 0;
        for (let node of this._nodes) {
            max += node.threads(scriptRam).max;
            available += node.threads(scriptRam).available;
        }

        return {
            max: max,
            used: max - available,
            available: available
        };
    }

    private getNode(hostname: string) {
        for (let node of this._nodes) {
            if (node.hostname === hostname) {
                return node;
            }
        }
        return null;
    }

    assign(job: Job) {
        let scriptRam = this._ns.getScriptRam(job.script);

        for (let node of this._nodes) {
            if (job.threads <= node.threads(scriptRam).available) {
                job.hostname = node.hostname;
                node.ram.used += job.threads * scriptRam;
                node.ram.available = node.ram.max - node.ram.used;
                this._ram.used += job.threads * scriptRam;
                this._ram.available = this._ram.max - this._ram.used;
                return true;
            }
        }

        return false;
    }

    unassign(job: Job) {
        if (job.hostname == "") {
            return;
        }
        let node = this.getNode(job.hostname);
        if (node === null) {
            return;
        }
        let scriptRam = this._ns.getScriptRam(job.script);
        node.ram.available += job.threads * scriptRam;
        node.ram.used = node.ram.max - node.ram.available;
        this.ram.available += job.threads * scriptRam;
        this.ram.used = this.ram.max - this.ram.available;
        job.hostname = "";
    }

    assignDividing(job: Job) {
        let scriptRam = this._ns.getScriptRam(job.script);
        let jobThreads = job.threads;
        let jobs: Job[] = [];
        for (let node of this._nodes) {
            if (node.threads(scriptRam).available > 0) {
                let threadsToRun = Math.min(node.threads(scriptRam).available, jobThreads);
                let dividedJob = new Job(this._ns);
                dividedJob.script = job.script;
                dividedJob.hostname = node.hostname;
                dividedJob.threads = threadsToRun;
                dividedJob.args = job.args;
                jobs.push(dividedJob);

                node.ram.used += threadsToRun * scriptRam;
                node.ram.available = node.ram.max - node.ram.used;
                this._ram.used += threadsToRun * scriptRam;
                this._ram.available = this._ram.max - this._ram.used;

                jobThreads -= threadsToRun;
                if (jobThreads <= 0) {
                    break;
                }
            }
        }

        return jobs;
    }
}

