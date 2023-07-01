export async function main(ns: NS) {
    let hostname: string = ns.args[0] as string;
    let timeEnd: number = ns.args[1] as number;
    let timeExecute: number = ns.args[2] as number;
    let port = ns.getPortHandle(ns.pid);

    let tDelay = 0;
    let delay = timeEnd - timeExecute - Date.now();
    if (delay < 0) {
        tDelay = -delay;
        delay = 0;
    }
    const promise = ns.weaken(hostname, { additionalMsec: delay });

    port.write(tDelay);
    await promise;

    ns.atExit(() => {
        if (ns.args[3] !== undefined) {
            port = ns.getPortHandle(ns.args[3] as number);
            port.write(ns.args[4] as string + ns.pid);
        }
    });
}
