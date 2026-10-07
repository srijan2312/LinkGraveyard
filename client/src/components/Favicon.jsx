// components/Favicon.jsx
// Shows a site's favicon next to its title. The icon is loaded from
// Google's favicon service (no API key needed, works for any domain).
//
// The important part is the fallback: if the image fails to load for any
// reason (offline, blocked, no icon for the domain), onError swaps it for
// a simple letter tile — so a broken-image icon can never appear in the UI.

import { useState } from 'react';

function domainOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

export default function Favicon({ url, size = 22 }) {
  const [failed, setFailed] = useState(false);
  const domain = domainOf(url);

  if (failed || !domain) {
    return (
      <span
        className="favicon-fallback"
        style={{ width: size, height: size, fontSize: Math.round(size * 0.52) }}
        aria-hidden="true"
        title={domain}
      >
        {(domain.charAt(0) || '?').toUpperCase()}
      </span>
    );
  }

  return (
    <img
      className="favicon-img"
      src={`https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(domain)}`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
