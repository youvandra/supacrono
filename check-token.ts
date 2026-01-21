
import { JsonRpcProvider, Contract } from "ethers";

const RPC = "https://evm-t3.cronos.org";
const ADDR = "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0";

const ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)"
];

async function main() {
    const provider = new JsonRpcProvider(RPC);
    const contract = new Contract(ADDR, ABI, provider);
    
    try {
        const name = await contract.name();
        const symbol = await contract.symbol();
        const decimals = await contract.decimals();
        
        console.log(`Address: ${ADDR}`);
        console.log(`Name: ${name}`);
        console.log(`Symbol: ${symbol}`);
        console.log(`Decimals: ${decimals}`);
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
