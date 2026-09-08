"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";
import {
  getOrCreateBurnerAccount,
  getConnectedExternalWallet,
  connectExternalWallet,
  disconnectExternalWallet,
} from "@/lib/wallet";

const NAV = [
  { href: "/", label: "The Docket" },
  { href: "/submit", label: "Submit" },
  { href: "/rulebook", label: "Rulebook" },
];

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function Header() {
  const [burnerAddress, setBurnerAddress] = useState<string | null>(null);
  const [externalAddress, setExternalAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const account = getOrCreateBurnerAccount();
      setBurnerAddress((account as { address: string }).address);
    } catch {
      // Address badge is a nice-to-have, not load-bearing.
    }
    setExternalAddress(getConnectedExternalWallet());
  }, []);

  async function handleConnect() {
    setConnecting(true);
    setError(null);
    try {
      const address = await connectExternalWallet();
      setExternalAddress(address);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    disconnectExternalWallet();
    setExternalAddress(null);
  }

  const activeAddress = externalAddress ?? burnerAddress;

  return (
    <header className="border-b border-hairline">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="text-ink no-underline">
          <Logo withWordmark className="h-7 w-7 text-ink" />
        </Link>
        <div className="flex items-center gap-6">
          <nav className="flex items-center gap-6 font-sans text-sm text-ink-muted">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="no-underline hover:text-ink">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {activeAddress && (
              <span
                className="rounded-sm border border-hairline px-2.5 py-1 font-mono text-xs text-ink-muted"
                title={
                  externalAddress
                    ? `Connected wallet: ${activeAddress}`
                    : `Burner wallet (auto-generated): ${activeAddress}`
                }
              >
                {shortenAddress(activeAddress)}
              </span>
            )}

            {externalAddress ? (
              <button
                onClick={handleDisconnect}
                className="font-sans text-xs text-ink-muted hover:text-ink underline decoration-hairline underline-offset-2"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="font-sans text-xs text-ink-muted hover:text-ink underline decoration-hairline underline-offset-2 disabled:opacity-50"
              >
                {connecting ? "Connecting…" : "Connect wallet"}
              </button>
            )}
          </div>
        </div>
      </div>
      {error && (
        <div className="mx-auto max-w-5xl px-6 pb-3">
          <p className="font-sans text-xs text-verdict-violation">{error}</p>
        </div>
      )}
    </header>
  );
}
