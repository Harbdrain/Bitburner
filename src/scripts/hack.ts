export async function main(ns: NS) {
    let hostname: string = ns.args[0] as string;
    let timeEnd: number = ns.args[1] as number;
    let timeExecute: number = ns.args[2] as number;

    let delta = timeEnd - Date.now() - timeExecute;
    if (delta < 0) {
        ns.tprint("WARNING: delta for hack execution is < 0");
        delta = 0;
    }
    await ns.hack(hostname, {additionalMsec: delta});
}

