export default class Server {
    private readonly reservedHomeRam = 20;
    private _ns: NS;
    hostname: string;

    constructor(ns: NS, hostname: string) {
        this._ns = ns;
        this.hostname = hostname;
    }

    get data() { return this._ns.getServer(this.hostname); }
    get ip() { return this.data.ip; }
    get hasRoot() { return this.data.hasAdminRights; }
    get cores() { return this.data.cpuCores; }
    get ports() {
        return {
            required: this.data.numOpenPortsRequired,
            open: this.data.openPortCount,
            ssh: this.data.sshPortOpen,
            ftp: this.data.ftpPortOpen,
            smtp: this.data.smtpPortOpen,
            http: this.data.httpPortOpen,
            sql: this.data.sqlPortOpen
        }
    }
    get ram() {
        return {
            max: Math.max(this.data.maxRam - (this.hostname === "home" ? this.reservedHomeRam : 0), 0),
            used: this.data.ramUsed,
            available: Math.max(this.data.maxRam - (this.hostname === "home" ? this.reservedHomeRam : 0) - this.data.ramUsed, 0)
        }
    }
    get isHome() { return this.hostname === "home"; }
    get money() {
        return {
            max: this.data.moneyMax,
            current: this.data.moneyAvailable,
        }
    }
    get security() {
        return {
            min: this.data.minDifficulty,
            current: this.data.hackDifficulty
        }
    }
    get hackLevel() { return this.data.requiredHackingSkill; }
    get purchased() { return (this.data.purchasedByPlayer && this.data.hostname !== "home"); }
    get connected() { return this.data.isConnectedTo; }
    get backdoored() { return this.data.backdoorInstalled; }

    threads(scriptRam: number) {
        return {
            max: Math.floor(this.ram.max / scriptRam),
            used: Math.floor(this.ram.used / scriptRam),
            available: Math.floor(this.ram.available / scriptRam)
        }
    }
}
