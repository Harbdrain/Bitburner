export async function main(ns: NS) {
    let hostname: string = ns.args[0] as string;
    let timeEnd: number = +ns.args[1];
    let port = ns.getPortHandle(ns.pid);

    let tDelay = 0;
    let delay = timeEnd - ns.getWeakenTime(hostname) - Date.now();
    if (delay < 0) {
        tDelay = -delay;
        delay = 0;
    }
    if (delay != delay) {
        delay = 0;
        ns.tprint("ERROR: delay is NaN");
    }
    const promise = ns.weaken(hostname, { additionalMsec: delay });

    port.write(tDelay);
    await promise;

    ns.atExit(() => {
        if (ns.args[2] !== undefined) {
            port = ns.getPortHandle(ns.args[2] as number);
            port.write(ns.args[3] as string + ns.pid);
        }
    });
}
