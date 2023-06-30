import Server from "interface/server";

export default class Node {
    private _hostname: string = "";
    private _ram: { max: number, used: number, available: number };

    constructor(server: Server) {
        this._hostname = server.hostname;
        this._ram = {
            max: server.ram.max,
            used: server.ram.used,
            available: server.ram.available
        }
    }

    get hostname() { return this._hostname; }
    get ram() { return this._ram; }

    threads(scriptRam: number) {
        return {
            max: Math.floor(this.ram.max / scriptRam),
            used: Math.floor(this.ram.used / scriptRam),
            available: Math.floor(this.ram.available / scriptRam)
        }
    }
}

