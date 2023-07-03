import Player from "./interface/player";

export async function main(ns: NS) {
    let player = new Player(ns);
    let currentLevel = ns.hacknet.getNodeStats(0).level;
    let currentRam = ns.hacknet.getNodeStats(0).ram;
    let currentCores = ns.hacknet.getNodeStats(0).cores;
    let currentGain = ns.formulas.hacknetNodes.moneyGainRate(currentLevel, currentRam, currentCores, player.hacknet.nodeMoney);

    ns.tprint(ns.formatNumber(currentGain));
    let newGain = ns.formulas.hacknetNodes.moneyGainRate(currentLevel, currentRam, currentCores + 1, player.hacknet.nodeMoney);
    let gain = newGain - currentGain;
    let cost = ns.hacknet.getCoreUpgradeCost(0);
    let roi = calcROI(cost, gain, 2*60*60);

    ns.tprint(gain);
}

function calcROI(cost: number, gain: number, time: number) {
    return (gain * time) / cost;
}
