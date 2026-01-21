const { JsonRpcProvider, Contract } = require("ethers");

const RPC_URL = "https://evm-t3.cronos.org";
// The allowlisted address that is NOT the missing one
const TOKEN_ADDRESS = "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0";

const ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function version() view returns (string)",
  "function decimals() view returns (uint8)",
  "function DOMAIN_SEPARATOR() view returns (bytes32)"
];

async function main() {
  const provider = new JsonRpcProvider(RPC_URL);
  
  console.log(`Checking token at ${TOKEN_ADDRESS} on ${RPC_URL}`);
  
  const code = await provider.getCode(TOKEN_ADDRESS);
  if (code === "0x") {
    console.log("Contract does not exist at this address!");
    return;
  }
  console.log("Contract exists (code length: " + code.length + ")");

  const contract = new Contract(TOKEN_ADDRESS, ABI, provider);

  try {
    const name = await contract.name();
    console.log("Name:", name);
  } catch (e) {
    console.log("Name: <error fetching>");
  }

  try {
    const symbol = await contract.symbol();
    console.log("Symbol:", symbol);
  } catch (e) {
    console.log("Symbol: <error fetching>");
  }

  try {
    const version = await contract.version();
    console.log("Version:", version);
  } catch (e) {
    console.log("Version: <error fetching>");
  }
  
    try {
    const decimals = await contract.decimals();
    console.log("Decimals:", decimals);
  } catch (e) {
    console.log("Decimals: <error fetching>");
  }
}

main().catch(console.error);
