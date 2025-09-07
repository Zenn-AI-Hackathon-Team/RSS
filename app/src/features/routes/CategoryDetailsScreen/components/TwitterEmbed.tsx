"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    twttr?: { widgets?: { load?: () => void } };
  }
}

type Props = {
  url: string; // full tweet URL
  align?: "center" | "left" | "right";
};

export default function TwitterEmbed({ url, align = "center" }: Props) {
  useEffect(() => {
    const ensure = () =>
      new Promise<void>((resolve) => {
        if (window.twttr?.widgets?.load) return resolve();
        const exist = document.querySelector<HTMLScriptElement>(
          'script[src="https://platform.twitter.com/widgets.js"]',
        );
        if (exist) {
          exist.addEventListener("load", () => resolve(), { once: true });
          return;
        }
        const s = document.createElement("script");
        s.async = true;
        s.defer = true;
        s.src = "https://platform.twitter.com/widgets.js";
        s.addEventListener("load", () => resolve(), { once: true });
        document.body.appendChild(s);
      });
    ensure().then(() => {
      // let next frame paint first
      setTimeout(() => window.twttr?.widgets?.load?.(), 0);
    });
  }, []);

  // normalize x.com -> twitter.com for embed stability
  const normalized = url.replace(/https?:\/\/(x\.com)/i, (m) => m.replace(/x\.com/i, "twitter.com"));

  return (
    <div className="w-full flex justify-center">
      <blockquote className="twitter-tweet" data-align={align} style={{ margin: 0 }}>
        <a href={normalized}></a>
      </blockquote>
    </div>
  );
}
