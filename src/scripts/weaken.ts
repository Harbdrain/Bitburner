export async function main(ns: NS) {
    let hostname: string = ns.args[0] as string;
    let timeEnd: number = ns.args[1] as number;
    let timeExecute: number = ns.args[2] as number;
    let shouldNotify: boolean = ns.args[3] as boolean;
    if (shouldNotify === undefined) {
        shouldNotify = false;
    }

    let delta = timeEnd - Date.now() - timeExecute;
    if (delta < 0) {
        ns.tprint("WARNING: delta for weaken execution is < 0");
        delta = 0;
    }
    await ns.weaken(hostname, { additionalMsec: delta });

    ns.atExit(() => {
        if (shouldNotify) {
            let port = ns.getPortHandle(ns.args[4] as number);
            port.write(0);
        }
    });
}
