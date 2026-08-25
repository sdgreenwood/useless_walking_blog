"use client";

import { useState } from "react";

export function ShareButton({ title }: { title: string }) {
  const [label, setLabel] = useState("Share replay");

  const share = async () => {
    const data = { title: `${title} · Walking Ocho`, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(data.url);
      setLabel("Link copied");
      window.setTimeout(() => setLabel("Share replay"), 1800);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setLabel("Copy unavailable");
    }
  };

  return <button className="share-button" type="button" onClick={share}>{label}</button>;
}
