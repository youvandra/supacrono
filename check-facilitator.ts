
import https from 'https';

const urls = [
    "https://facilitator.cronoslabs.org", // Working (but maybe Mainnet?)
    "https://facilitator.cronoslabs.org/testnet",
    "https://facilitator-testnet.cronoslabs.org",
    "https://testnet-facilitator.cronoslabs.org",
    "https://facilitator.t3.cronos.org",
    "https://facilitator.cronos-testnet.crypto.org",
    "https://cronos-testnet-facilitator.cronoslabs.org"
];

function checkUrl(url: string) {
    return new Promise((resolve) => {
        const req = https.get(url, (res) => {
            console.log(`[${res.statusCode}] ${url}`);
            resolve(true);
        });
        req.on('error', (e) => {
            console.log(`[FAILED] ${url}: ${e.message}`);
            resolve(false);
        });
        req.end();
    });
}

async function main() {
    console.log("Checking Facilitator URLs...");
    for (const url of urls) {
        await checkUrl(url);
    }
}

main();
