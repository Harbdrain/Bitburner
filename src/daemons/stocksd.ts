import Stock from "/interface/stock";

export async function main(ns: NS) {
    let symbols = ns.stock.getSymbols();
    let stocks = symbols.map(s => new Stock(ns, s));

    while (true) {
        for (let stock of stocks) {
            if (stock.forecast < 0.5) {
                stock.sell();
            }
        }

        stocks.sort((a, b) => b.forecast - a.forecast);
        let stocksToBuy = stocks.filter(stock => stock.forecast > 0.5);
        stocksToBuy.forEach(stock => stock.buy());
        await ns.sleep(6000);
    }
}
