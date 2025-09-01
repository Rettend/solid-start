import { createSignal } from "solid-js";

export const ssr = false;

export default function SsrOff() {
  const [count, setCount] = createSignal(0);
  return (
    <main>
      <h1 id="ssr-flag">SSR-OFF</h1>
      <span id="ssr-off-count">{count()}</span>
      <button id="ssr-off-button" onClick={() => setCount(n => n + 1)}>
        inc
      </button>
    </main>
  );
}


