const types = ["Find Largest Prime Factor", "Subarray with Maximum Sum", "Total Ways to Sum", "Total Ways to Sum II", "Spiralize Matrix", "Array Jumping Game", "Array Jumping Game II", "Merge Overlapping Intervals", "Generate IP Addresses", "Algorithmic Stock Trader I", "Algorithmic Stock Trader II", "Algorithmic Stock Trader III", "Algorithmic Stock Trader IV", "Minimum Path Sum in a Triangle", "Unique Paths in a Grid I", "Unique Paths in a Grid II", "Shortest Path in a Grid", "Sanitize Parentheses in Expression", "Find All Valid Math Expressions", "HammingCodes: Integer to Encoded Binary", "HammingCodes: Encoded Binary to Integer", "Proper 2-Coloring of a Graph", "Compression I: RLE Compression", "Compression II: LZ Decompression", "Compression III: LZ Compression", "Encryption I: Caesar Cipher", "Encryption II: Vigenère Cipher"]

export async function main(ns: NS) {
    ns.codingcontract.createDummyContract("Find Largest Prime Factor");
    let contract = ns.ls("home").find(c => c.endsWith(".cct")) as string;
    let data = ns.codingcontract.getData(contract);
    let result = await getLargestPrimeFactor(ns, +data);
    let reward = ns.codingcontract.attempt(result, contract);
    ns.tprint(`${data}: ${result}`);
    if (reward === "") {
        reward = "ERROR: bad";
    } else {
    }
    ns.tprint(reward);
}

async function getLargestPrimeFactor(ns: NS, num: number) {
    let result = 1;
    for (let i = 2; i * i <= num; i++) {
        while (num % i === 0) {
            num /= i;
            result = i;
        }
        await ns.sleep(0);
        ns.print(i);
    }
    if (result === 1) {
        result = num;
    }
    return result;
}
