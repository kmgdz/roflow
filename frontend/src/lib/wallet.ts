import { createAccount, generatePrivateKey } from "genlayer-js";

const BURNER_STORAGE_KEY = "rule-of-law:burner-pk";
const EXTERNAL_WALLET_KEY = "rule-of-law:external-wallet";

type EthereumProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

function getInjectedProvider(): EthereumProvider | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { ethereum?: EthereumProvider }).ethereum ?? null;
}

/**
 * Zero-friction demo wallet: generates a private key in the browser and
 * persists it in localStorage so judges (or you, in a demo) never need
 * to install or fund an external wallet extension to try the app.
 *
 * Note: genlayer-js's createAccount() does not return the private key on
 * the account object it hands back, so the key has to be generated
 * separately with generatePrivateKey() and stored ourselves, then passed
 * into createAccount(privateKey) to reconstruct the same signer next time.
 */
export function getOrCreateBurnerAccount() {
  if (typeof window === "undefined") {
    throw new Error("getOrCreateBurnerAccount can only run in the browser");
  }

  let privateKey = window.localStorage.getItem(BURNER_STORAGE_KEY) as `0x${string}` | null;
  if (!privateKey) {
    privateKey = generatePrivateKey();
    window.localStorage.setItem(BURNER_STORAGE_KEY, privateKey);
  }
  return createAccount(privateKey);
}

export function resetBurnerAccount() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(BURNER_STORAGE_KEY);
  }
}

const STUDIONET_CHAIN_ID_HEX = "0xF22F"; // 61999 in hex

const STUDIONET_PARAMS = {
  chainId: STUDIONET_CHAIN_ID_HEX,
  chainName: "GenLayer Studionet",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: ["https://studio.genlayer.com/api"],
  blockExplorerUrls: ["https://explorer-studio.genlayer.com"],
};

async function ensureStudionet(provider: EthereumProvider): Promise<void> {
  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: STUDIONET_CHAIN_ID_HEX }],
    });
  } catch (err) {
    // 4902 = chain not added to the wallet yet. Add it, then switching
    // happens automatically as part of wallet_addEthereumChain.
    const code = (err as { code?: number })?.code;
    if (code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [STUDIONET_PARAMS],
      });
    } else {
      // Any other error (user rejected, unsupported method, etc.) is
      // non-fatal here — genlayer-js's own chain check is skipped for
      // Studio-based chains anyway, so a failed switch just means the
      // person's wallet UI won't show "GenLayer Studionet" as the active
      // network, not that transactions will actually fail.
      throw err;
    }
  }
}

/**
 * Real wallet connect (MetaMask, Rabby, or any injected EIP-1193 provider).
 *
 * genlayer-js has built-in support for this: pass a plain address STRING
 * (not a local signer object) as the client's `account`, and genlayer-js
 * automatically delegates every signing request to `window.ethereum`,
 * popping up the wallet extension exactly like any other dApp. No custom
 * signer wiring required.
 */
export async function connectExternalWallet(): Promise<string> {
  const provider = getInjectedProvider();
  if (!provider) {
    throw new Error("No wallet extension found. Install MetaMask or Rabby and try again.");
  }
  const accounts = (await provider.request({ method: "eth_requestAccounts" })) as string[];
  if (!accounts || accounts.length === 0) {
    throw new Error("No account was returned by the wallet.");
  }

  try {
    await ensureStudionet(provider);
  } catch {
    // Don't block connecting just because the network switch prompt was
    // dismissed or unsupported — the wallet still works for signing.
  }

  window.localStorage.setItem(EXTERNAL_WALLET_KEY, accounts[0]);
  return accounts[0];
}

export function getConnectedExternalWallet(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(EXTERNAL_WALLET_KEY);
}

export function disconnectExternalWallet() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(EXTERNAL_WALLET_KEY);
  }
}

/**
 * The account every write should actually use: a connected real wallet
 * if the person chose to connect one, otherwise the burner wallet.
 * Returns either a plain address string (external wallet -> signed via
 * window.ethereum) or a local Account object (burner -> signed locally).
 */
export function getActiveAccount(): ReturnType<typeof getOrCreateBurnerAccount> | string {
  const external = getConnectedExternalWallet();
  if (external) return external;
  return getOrCreateBurnerAccount();
}
