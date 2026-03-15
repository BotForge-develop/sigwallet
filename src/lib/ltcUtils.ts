import { ethers } from 'ethers';

/**
 * Base58 alphabet used by Bitcoin/Litecoin
 */
const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(data: Uint8Array): string {
  let num = BigInt('0x' + Array.from(data).map(b => b.toString(16).padStart(2, '0')).join(''));
  let result = '';
  while (num > 0n) {
    const remainder = Number(num % 58n);
    num = num / 58n;
    result = BASE58_ALPHABET[remainder] + result;
  }
  // Preserve leading zeros
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

  // Double SHA256 checksum
  const hash1 = ethers.getBytes(ethers.sha256(versioned));
  const hash2 = ethers.getBytes(ethers.sha256(hash1));
  const checksum = hash2.slice(0, 4);

  const full = new Uint8Array(versioned.length + 4);
  full.set(versioned);
  full.set(checksum, versioned.length);

  return base58Encode(full);
}

/**
 * Derives a Litecoin P2PKH address from a BIP39 mnemonic.
 * Uses BIP44 path: m/44'/2'/0'/0/0
 */
export function deriveLtcAddress(mnemonic: string): string {
  const node = ethers.HDNodeWallet.fromPhrase(mnemonic, "", "m/44'/2'/0'/0/0");
  const pubKeyBytes = ethers.getBytes(node.publicKey);

  // Hash160 = RIPEMD160(SHA256(pubkey))
  const hash160 = ethers.getBytes(ethers.ripemd160(ethers.sha256(pubKeyBytes)));

  // LTC P2PKH version byte = 0x30 (48)
  return base58CheckEncode(0x30, hash160);
}

/**
 * Fetch LTC balance from BlockCypher public API
 */
export async function fetchLtcBalance(address: string): Promise<string> {
  try {
    const res = await fetch(
      `https://api.blockcypher.com/v1/ltc/main/addrs/${address}/balance`
    );
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return (data.final_balance / 1e8).toFixed(8);
  } catch {
    return '—';
  }
}
