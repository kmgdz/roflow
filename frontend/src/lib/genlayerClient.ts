import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { Account, Address } from "viem";

/**
 * Set this after deploying contracts/rule_of_law.py in GenLayer Studio.
 * Kept as an env var (not hardcoded) so redeploying the contract never
 * requires touching application code.
 */
export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ??
  "0x0D9E8a769432b4A07182147fDcaFF41e93d4d93C") as Address;

/**
 * Read-only client. Per GenLayer's own docs: "Public view methods read
 * Intelligent Contract state without submitting a consensus transaction.
 * They do not need a transaction fee or signing account." No account is
 * ever attached here, by design.
 */
export const client = createClient({ chain: studionet });

/**
 * Thin wrapper around readContract for our contract's view methods.
 * `args` order must match the Python method signature exactly.
 */
export async function readRuleOfLaw<T = unknown>(
  functionName: string,
  args: (string | number | boolean | bigint)[] = []
): Promise<T> {
  return client.readContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args,
  }) as Promise<T>;
}

/**
 * Thin wrapper around writeContract + waitForTransactionReceipt for our
 * contract's write methods.
 *
 * `account` can be either:
 *  - a local signer Account (e.g. the burner wallet) -> signs locally, or
 *  - a plain address string (a connected external wallet) -> genlayer-js
 *    automatically delegates every signing request to window.ethereum,
 *    which pops up MetaMask/Rabby exactly like any other dApp.
 *
 * Because that delegation is configured when the client is created (not
 * per-call), a fresh client is created here bound to whichever account
 * is currently active, rather than reusing the shared read-only client.
 */
export async function writeRuleOfLaw(
  account: Account | string,
  functionName: string,
  args: (string | number | boolean | bigint)[] = []
) {
  const writeClient = createClient({ chain: studionet, account } as never);

  const txHash = await writeClient.writeContract({
    account,
    address: CONTRACT_ADDRESS,
    functionName,
    args,
    value: BigInt(0),
  } as never);

  return writeClient.waitForTransactionReceipt({ hash: txHash });
}
