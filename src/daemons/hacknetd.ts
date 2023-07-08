import Player from "/interface/player";

enum Actions { PURCHASE_NODE, UPGRADE_LEVEL, UPGRADE_RAM, UPGRADE_CORE }

export async function main(ns: NS) {
    let player = new Player(ns);
    let targetTime = 10 * 60 * 60;
    if (ns.args[0] !== undefined) {
        targetTime = ns.args[0] as number * 60 * 60;
    }

    while (true) {
        await ns.sleep(100);
        while (!player.software.formulas) {
            await ns.sleep(1000);
        }

        let actions: { action: Actions, roi: number, node: number, cost: number }[] = [];
        let numNodes = ns.hacknet.numNodes();
        if (numNodes < ns.hacknet.maxNumNodes()) {
            let gain: number;
            let currentLevel = 1;
            let currentRam = 1;
            let currentCores = 1;
            if (numNodes > 0) {
                currentLevel = ns.hacknet.getNodeStats(0).level;
                currentRam = ns.hacknet.getNodeStats(0).ram;
                currentCores = ns.hacknet.getNodeStats(0).cores;
            }
            gain = ns.formulas.hacknetNodes.moneyGainRate(currentLevel, currentRam, currentCores, player.hacknet.nodeMoney);
            let cost = ns.hacknet.getPurchaseNodeCost();
            let roi = calcROI(cost, gain, targetTime);
            actions.push({ action: Actions.PURCHASE_NODE, roi: roi, node: numNodes + 1, cost: cost });
        }
        for (let i = 0; i < numNodes; i++) {
            let currentLevel = ns.hacknet.getNodeStats(i).level;
            let currentRam = ns.hacknet.getNodeStats(i).ram;
            let currentCores = ns.hacknet.getNodeStats(i).cores;
            let currentGain = ns.formulas.hacknetNodes.moneyGainRate(currentLevel, currentRam, currentCores, player.hacknet.nodeMoney);

            let newGain = ns.formulas.hacknetNodes.moneyGainRate(currentLevel + 1, currentRam, currentCores, player.hacknet.nodeMoney);
            let gain = newGain - currentGain;
            let cost = ns.hacknet.getLevelUpgradeCost(i);
            let roi = calcROI(cost, gain, targetTime);
            actions.push({ action: Actions.UPGRADE_LEVEL, roi: roi, node: i, cost: cost });


            newGain = ns.formulas.hacknetNodes.moneyGainRate(currentLevel, currentRam * 2, currentCores, player.hacknet.nodeMoney);
            gain = newGain - currentGain;
            cost = ns.hacknet.getRamUpgradeCost(i);
            roi = calcROI(cost, gain, targetTime);
            actions.push({ action: Actions.UPGRADE_RAM, roi: roi, node: i, cost: cost });


            newGain = ns.formulas.hacknetNodes.moneyGainRate(currentLevel, currentRam, currentCores + 1, player.hacknet.nodeMoney);
            gain = newGain - currentGain;
            cost = ns.hacknet.getCoreUpgradeCost(i);
            roi = calcROI(cost, gain, targetTime);
            actions.push({ action: Actions.UPGRADE_CORE, roi: roi, node: i, cost: cost });
        }

        let bestAction = actions.reduce(reducer, null);
        if (bestAction === null || bestAction.roi < 1) {
            break;
        }

        while (player.money < bestAction.cost) {
            await ns.sleep(100);
        }
        switch (bestAction.action) {
            case Actions.PURCHASE_NODE: {
                ns.hacknet.purchaseNode();
            } break;
            case Actions.UPGRADE_LEVEL: {
                ns.hacknet.upgradeLevel(bestAction.node);
            } break;
            case Actions.UPGRADE_RAM: {
                ns.hacknet.upgradeRam(bestAction.node);
            } break;
            case Actions.UPGRADE_CORE: {
                ns.hacknet.upgradeCore(bestAction.node);
            } break;
        }
    }
}

function reducer(acc: any, action: any): { action: Actions, roi: number, node: number, cost: number } {
    if (acc === null) {
        return action;
    }
    if (acc.roi > action.roi) {
        return acc;
    }
    return action;
}

function calcROI(cost: number, gain: number, time: number) {
    return (gain * time) / cost;
}
