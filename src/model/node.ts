import Server from "interface/server";

export default class Node {
    hostname: string = "";
    ram: { max: number, used: number, available: number };

    constructor(server: Server) {
        this.hostname = server.hostname;
        this.ram = {
            max: server.ram.max,
            used: server.ram.used,
            available: server.ram.available
        }
    }

    threads(scriptRam: number) {
            return Math.floor(this.ram.available / scriptRam);
    }
}

