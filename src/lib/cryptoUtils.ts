import { ethers } from 'ethers';

// ─── Types ───────────────────────────────────────────────────────────
export type CoinType = 'eth' | 'ltc' | 'btc';

export const COINS: { id: CoinType; label: string; symbol: string; icon: string; decimals: number }[] = [
  { id: 'eth', label: 'Ethereum', symbol: 'ETH', icon: 'Ξ', decimals: 18 },
  { id: 'btc', label: 'Bitcoin', symbol: 'BTC', icon: '₿', decimals: 8 },
  { id: 'ltc', label: 'Litecoin', symbol: 'LTC', icon: 'Ł', decimals: 8 },
];

const COIN_CONFIG: Record<CoinType, { path: string; version: number; bcNetwork: string }> = {
  eth: { path: "m/44'/60'/0'/0/0", version: 0x00, bcNetwork: '' },
  btc: { path: "m/44'/0'/0'/0/0", version: 0x00, bcNetwork: 'btc/main' },
  ltc: { path: "m/44'/2'/0'/0/0", version: 0x30, bcNetwork: 'ltc/main' },
};

// ─── Base58Check (using ethers' sha256 + ripemd160) ──────────────────
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(data: Uint8Array): string {
  if (data.length === 0) return '';
  let num = BigInt('0x' + Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(''));
  let result = '';
  while (num > 0n) {
    result = BASE58_ALPHABET[Number(num % 58n)] + result;
    num = num / 58n;
  }
  for (const byte of data) {
    if (byte === 0) result = '1' + result;
    else break;
  }
  return result;
}

function base58CheckEncode(version: number, payload: Uint8Array): string {
  const versioned = new Uint8Array(1 + payload.length);
  versioned[0] = version;
  versioned.set(payload, 1);
  const hash1 = ethers.getBytes(ethers.sha256(versioned));
  const hash2 = ethers.getBytes(ethers.sha256(hash1));
  const full = new Uint8Array(versioned.length + 4);
  full.set(versioned);
  full.set(hash2.slice(0, 4), versioned.length);
  return base58Encode(full);
}

// ─── Address Derivation ──────────────────────────────────────────────
export function deriveAddress(mnemonic: string, coin: CoinType): string {
  if (coin === 'eth') {
    return ethers.HDNodeWallet.fromPhrase(mnemonic).address;
  }
  const config = COIN_CONFIG[coin];
  const node = ethers.HDNodeWallet.fromPhrase(mnemonic, '', config.path);
  const pubKeyBytes = ethers.getBytes(node.publicKey);
  const hash160 = ethers.getBytes(ethers.ripemd160(ethers.sha256(pubKeyBytes)));
  return base58CheckEncode(config.version, hash160);
}

export function derivePrivateKey(mnemonic: string, coin: CoinType): string {
  const config = COIN_CONFIG[coin];
  return ethers.HDNodeWallet.fromPhrase(mnemonic, '', config.path).privateKey;
}

// ─── Balance Fetching ────────────────────────────────────────────────
export async function fetchBalance(address: string, coin: CoinType, rpcUrl?: string): Promise<string> {
  try {
    if (coin === 'eth') {
      const provider = new ethers.JsonRpcProvider(rpcUrl || 'https://eth.llamarpc.com');
      const bal = await provider.getBalance(address);
      return ethers.formatEther(bal);
    }
    const network = COIN_CONFIG[coin].bcNetwork;
    const res = await fetch(`https://api.blockcypher.com/v1/${network}/addrs/${address}/balance`);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return (data.final_balance / 1e8).toFixed(8);
  } catch {
    return '—';
  }
}

// ─── Explorer URLs ───────────────────────────────────────────────────
export function getExplorerUrl(address: string, coin: CoinType): string {
  switch (coin) {
    case 'eth': return `https://etherscan.io/address/${address}`;
    case 'btc': return `https://blockchair.com/bitcoin/address/${address}`;
    case 'ltc': return `https://blockchair.com/litecoin/address/${address}`;
  }
}

export function getTxExplorerUrl(txHash: string, coin: CoinType): string {
  switch (coin) {
    case 'eth': return `https://etherscan.io/tx/${txHash}`;
    case 'btc': return `https://blockchair.com/bitcoin/transaction/${txHash}`;
    case 'ltc': return `https://blockchair.com/litecoin/transaction/${txHash}`;
  }
}

// ─── Sending (ETH via ethers, BTC/LTC via BlockCypher) ───────────────

/** DER-encode an ECDSA signature from r,s hex strings */
function derEncode(rHex: string, sHex: string): string {
  let rBytes = Array.from(ethers.getBytes('0x' + rHex));
  let sBytes = Array.from(ethers.getBytes('0x' + sHex));
  // Ensure positive integer encoding
  if (rBytes[0] >= 0x80) rBytes = [0, ...rBytes];
  if (sBytes[0] >= 0x80) sBytes = [0, ...sBytes];
  const totalLen = 2 + rBytes.length + 2 + sBytes.length;
  const der = [0x30, totalLen, 0x02, rBytes.length, ...rBytes, 0x02, sBytes.length, ...sBytes];
  return der.map(b => b.toString(16).padStart(2, '0')).join('');
}

export interface SendResult {
  txHash: string;
  explorerUrl: string;
}

export async function sendTransaction(
  mnemonic: string,
  coin: CoinType,
  to: string,
  amount: string,
  rpcUrl?: string
): Promise<SendResult> {
  if (coin === 'eth') {
    return sendEth(mnemonic, to, amount, rpcUrl || 'https://eth.llamarpc.com');
  }
  return sendUtxoCoin(mnemonic, coin, to, amount);
}

async function sendEth(mnemonic: string, to: string, amount: string, rpcUrl: string): Promise<SendResult> {
  const hdWallet = ethers.HDNodeWallet.fromPhrase(mnemonic);
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = hdWallet.connect(provider);
  const tx = await signer.sendTransaction({
    to,
    value: ethers.parseEther(amount),
  });
  return {
    txHash: tx.hash,
    explorerUrl: getTxExplorerUrl(tx.hash, 'eth'),
  };
}

async function sendUtxoCoin(mnemonic: string, coin: CoinType, to: string, amount: string): Promise<SendResult> {
  const config = COIN_CONFIG[coin];
  const node = ethers.HDNodeWallet.fromPhrase(mnemonic, '', config.path);
  const fromAddress = deriveAddress(mnemonic, coin);
  const satoshis = Math.round(parseFloat(amount) * 1e8);

  if (satoshis <= 0) throw new Error('Invalid amount');

  // 1. Create unsigned tx via BlockCypher
  const createRes = await fetch(`https://api.blockcypher.com/v1/${config.bcNetwork}/txs/new`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inputs: [{ addresses: [fromAddress] }],
      outputs: [{ addresses: [to], value: satoshis }],
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json();
    throw new Error(err.errors?.[0]?.error || err.error || 'Failed to create transaction');
  }

  const txData = await createRes.json();

  if (!txData.tosign || txData.tosign.length === 0) {
    throw new Error('No transaction to sign');
  }

  // 2. Sign each hash
  const signingKey = new ethers.SigningKey(node.privateKey);
  const signatures: string[] = [];
  const pubkeys: string[] = [];

  for (const hashHex of txData.tosign) {
    const sig = signingKey.sign('0x' + hashHex);
    const r = sig.r.slice(2); // remove 0x
    const s = sig.s.slice(2);
    signatures.push(derEncode(r, s));
    pubkeys.push(node.publicKey.slice(2)); // compressed pubkey without 0x
  }

  // 3. Send signed tx
  const sendRes = await fetch(`https://api.blockcypher.com/v1/${config.bcNetwork}/txs/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tx: txData.tx,
      tosign: txData.tosign,
      signatures,
      pubkeys,
    }),
  });

  if (!sendRes.ok) {
    const err = await sendRes.json();
    throw new Error(err.errors?.[0]?.error || err.error || 'Broadcast failed');
  }

  const result = await sendRes.json();
  const txHash = result.tx?.hash || '';

  return {
    txHash,
    explorerUrl: getTxExplorerUrl(txHash, coin),
  };
}
