export default class Job {
    ns: NS;
    script: string = ""                        // script to run
    hostname: string = ""                      // hostname of the server where script will run
    threads: number = 0                        // how many threads use for job
    args: (string | number | boolean)[] = []   // arguments to pass to script

    constructor(ns: NS) {
        this.ns = ns;
    }

    exec() {
        if (this.script === "") {
            this.ns.tprint("ERROR: tried to exec job with empty script");
            return;
        }
        if (this.hostname === "") {
            this.ns.tprint("ERROR: tried to exec job with empty hostname");
            return;
        }
        if (this.threads === 0) {
            this.ns.tprint(`ERROR: tried to exec job(${this.script} ${this.hostname}) with zero threads`);
            return;
        }
        this.ns.scp(this.script, this.hostname, "home");
        return this.ns.exec(this.script, this.hostname, this.threads, ...this.args);
    }
}
