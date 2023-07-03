export default class Stock {
    private ns: NS;
    private _sym: string;
    constructor(ns: NS, sym: string) {
        this.ns = ns;
        this._sym = sym;
    }

    get sym() {
        return this._sym;
    }

    get forecast() {
        return this.ns.stock.getForecast(this.sym);
    }

    get price() {
        return {
            ask: this.ns.stock.getAskPrice(this.sym), // price to buy stocks for
            bid: this.ns.stock.getBidPrice(this.sym)  // price to sell stocks for
        }
    }

    get maxShares() {
        return this.ns.stock.getMaxShares(this.sym);
    }

    get purchaseCost() {
        return this.ns.stock.getPurchaseCost(this.sym, this.maxShares, "Long");
    }

    buy() {
        if (this.ns.getServerMoneyAvailable("home") > this.purchaseCost) {
            this.ns.stock.buyStock(this.sym, this.maxShares);
            return true;
        }
        return false;
    }

    sell() {
        this.ns.stock.sellStock(this.sym, this.maxShares);
    }
}
