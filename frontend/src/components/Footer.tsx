import { CONTRACT_ADDRESS } from "@/lib/genlayerClient";

export function Footer() {
  return (
    <footer className="border-t border-hairline mt-24">
      <div className="mx-auto max-w-5xl px-6 py-10 font-sans text-xs text-ink-faint">
        <p>
          Rulings are produced by GenLayer validators under Optimistic Democracy
          consensus, running on Studionet.
        </p>
        <p className="mt-1 font-mono">{CONTRACT_ADDRESS}</p>
      </div>
    </footer>
  );
}
