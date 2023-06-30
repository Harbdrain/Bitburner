export default class Player {
    private _ns: NS;
    constructor(ns: NS) {
        this._ns = ns;
    }

    get data() { return this._ns.getPlayer(); }
    get hackLevel() { return this.data.skills.hacking; }
    get ports() { return this._ns.ls("home").filter(file => [
        "BruteSSH.exe",
        "FTPCrack.exe",
        "relaySMTP.exe",
        "HTTPWorm.exe",
        "SQLInject.exe"
    ].includes(file)).length}
    get software() { return {
        ssh: this._ns.ls("home").some(file => file === "BruteSSH.exe"),
        ftp: this._ns.ls("home").some(file => file === "FTPCrack.exe"),
        smtp: this._ns.ls("home").some(file => file === "relaySMTP.exe"),
        http: this._ns.ls("home").some(file => file === "HTTPWorm.exe"),
        sql: this._ns.ls("home").some(file => file === "SQLInject.exe"),
        formulas: this._ns.ls("home").some(file => file === "Formulas.exe"),
    }}
}
