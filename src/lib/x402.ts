import { BrowserProvider, isAddress } from "ethers";

/**
 * Generates a random 32-byte nonce for EIP-3009 authorization
 */
export function generateNonce() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return "0x" + Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Creates a signed payment header for x402 payments
 */
export async function createPaymentHeader({ 
  provider, 
  paymentRequirements 
}: { 
  provider: BrowserProvider; 
  paymentRequirements: any 
}) {
  const { payTo, asset, maxAmountRequired, maxTimeoutSeconds, scheme, network } = paymentRequirements;
  
  if (!isAddress(asset)) throw new Error(`Invalid asset address: ${asset}`);
  if (!isAddress(payTo)) throw new Error(`Invalid payTo address: ${payTo}`);

  const signer = await provider.getSigner();
  const signerAddress = await signer.getAddress();

  // Generate unique nonce
  const nonce = generateNonce();
  
  // Calculate validity window
  const validAfter = 0; // Valid immediately
  const validBefore = Math.floor(Date.now() / 1000) + (maxTimeoutSeconds || 3600);

  // Set up EIP-712 domain
  const domain = {
    name: "Bridged USDC (Stargate)",
    version: "1",
    chainId: 338, // Cronos Testnet
    verifyingContract: asset,
  };

  // Define EIP-712 typed data structure
  const types = {
    TransferWithAuthorization: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' },
    ],
  };

  // Create the message to sign
  const message = {
    from: signerAddress,
    to: payTo,
    value: maxAmountRequired,
    validAfter: validAfter,
    validBefore: validBefore,
    nonce: nonce,
  };

  // Sign using EIP-712
  const signature = await signer.signTypedData(domain, types, message);

  // Construct payment header
  const paymentHeader = {
    x402Version: 1,
    scheme: scheme,
    network: network,
    payload: {
      from: signerAddress,
      to: payTo,
      value: maxAmountRequired,
      validAfter: validAfter,
      validBefore: validBefore,
      nonce: nonce,
      signature: signature,
      asset: asset,
    },
  };

  // Base64-encode
  return btoa(JSON.stringify(paymentHeader));
}
