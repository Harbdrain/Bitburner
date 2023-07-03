export async function main(ns: NS) {
    let locations = ns.infiltration.getPossibleLocations();

    for (let location of locations) {
        let loot = ns.infiltration.getInfiltration(location.name);
        ns.tprint(loot.reward);
    }
}
