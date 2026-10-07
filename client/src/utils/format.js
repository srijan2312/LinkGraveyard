// utils/format.js
// Small display helpers used across pages. No libraries needed.

export function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// "3 hours ago", "2 days ago" — friendlier than raw timestamps.
export function timeAgo(date) {
  if (!date) return 'Never';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(date).toLocaleDateString();
}

export function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export const STATUS_META = {
  healthy: { label: 'Healthy', emoji: '🟢', hint: 'Responds successfully' },
  redirected: { label: 'Redirected', emoji: '🟡', hint: 'Points somewhere new' },
  broken: { label: 'Broken', emoji: '🔴', hint: 'Could not be reached' },
  never_checked: { label: 'Never checked', emoji: '⚪', hint: 'Status not determined yet' },
};
