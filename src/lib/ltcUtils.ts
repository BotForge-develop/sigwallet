import { ethers } from 'ethers';
// @ts-ignore - noble/hashes subpath exports work at runtime
import { sha256 } from '@noble/hashes/sha256';
// @ts-ignore - noble/hashes subpath exports work at runtime
import { ripemd160 } from '@noble/hashes/ripemd160';
import { base58check } from '@scure/base';

const b58c = base58check(sha256);

/**
 * Derives a Litecoin P2PKH address from a BIP39 mnemonic.
 * Uses BIP44 path: m/44'/2'/0'/0/0
 * Returns address starting with "L" (mainnet)
 */
export function deriveLtcAddress(mnemonic: string): string {
  const node = ethers.HDNodeWallet.fromPhrase(mnemonic, "", "m/44'/2'/0'/0/0");
  const pubKeyBytes = ethers.getBytes(node.publicKey);

  // Hash160 = RIPEMD160(SHA256(compressed_pubkey))
  const hash160 = ripemd160(sha256(pubKeyBytes));

  // LTC P2PKH version byte = 0x30 (48)
  const payload = new Uint8Array(21);
  payload[0] = 0x30;
  payload.set(hash160, 1);

  return b58c.encode(payload);
}

/**
 * Derives the LTC private key in WIF format for export/signing
 */
export function deriveLtcPrivateKey(mnemonic: string): string {
  const node = ethers.HDNodeWallet.fromPhrase(mnemonic, "", "m/44'/2'/0'/0/0");
  const privKeyBytes = ethers.getBytes(node.privateKey);

  // WIF: version(0xB0) + privkey + compressed_flag(0x01) + checksum
  const payload = new Uint8Array(34);
  payload[0] = 0xb0; // LTC mainnet WIF version
  payload.set(privKeyBytes, 1);
  payload[33] = 0x01; // compressed

  return b58c.encode(payload);
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
