import Stock from "/interface/stock";

export async function main(ns: NS) {
    let symbols = ns.stock.getSymbols();
    let stocks = symbols.map(s => new Stock(ns, s));
    stocks.forEach(stock => stock.sell());
}
