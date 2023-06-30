export default class Job {
    private _ns: NS;
    private _script: string = ""                        // script to run
    private _hostname: string = ""                      // hostname of the server where script will run
    private _threads: number = 0                        // how many threads use for job
    private _args: (string | number | boolean)[] = []   // arguments to pass to script

    constructor(ns: NS) {
        this._ns = ns;
    }

    get script() { return this._script; }
    set script(script) { this._script = script; }
    get hostname() { return this._hostname; }
    set hostname(hostname) { this._hostname = hostname; }
    get threads() { return this._threads; }
    set threads(threads) { this._threads = threads; }
    get args() { return this._args; }
    set args(args) { this._args = args; }

    exec() {
        if (this._script === "") {
            this._ns.tprint("ERROR: tried to exec job with empty script");
            return;
        }
        if (this._hostname === "") {
            this._ns.tprint("ERROR: tried to exec job with empty hostname");
            return;
        }
        if (this._threads === 0) {
            this._ns.tprint(`ERROR: tried to exec job(${this._script} ${this._hostname}) with zero threads`);
            return;
        }
        this._ns.scp(this._script, this._hostname, "home");
        return this._ns.exec(this._script, this._hostname, this._threads, ...this._args);
    }
}
