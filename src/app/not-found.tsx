import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <p className="eyebrow">Replay under review</p>
      <h1>This walk has left the broadcast area.</h1>
      <p>The replay does not exist, or officials have declined to acknowledge it.</p>
      <Link className="primary-action" href="/">Return to the replay desk</Link>
    </main>
  );
}
