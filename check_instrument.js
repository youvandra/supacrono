
const https = require('https');

https.get('https://api.crypto.com/exchange/v1/public/get-instruments', (resp) => {
  let data = '';

  resp.on('data', (chunk) => {
    data += chunk;
  });

  resp.on('end', () => {
    try {
        const json = JSON.parse(data);
        if (json.code === 0 && json.result && json.result.data) {
            const inst = json.result.data.find(i => i.symbol === 'CROUSD-PERP');
            console.log(JSON.stringify(inst, null, 2));
        } else {
            console.log("Unexpected response structure or error code:", JSON.stringify(json).substring(0, 200));
        }
    } catch (e) {
        console.error("Error parsing:", e);
        console.log("Raw data sample:", data.substring(0, 200));
    }
  });

}).on("error", (err) => {
  console.log("Error: " + err.message);
});
