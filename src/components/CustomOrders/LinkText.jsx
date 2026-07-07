import React from 'react';
import styles from './LinkText.module.css';

const URL_RE = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;
const TRAILING_RE = /[.,;:!?)\]}'"»…]+$/;
const MAX_LABEL = 32;

const shortenUrl = (url, domainOnly) => {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    const host = u.hostname.replace(/^www\./, '');
    if (domainOnly) return host;
    let rest = `${u.pathname}${u.search}${u.hash}`;
    if (rest === '/') rest = '';
    const label = host + rest;
    return label.length > MAX_LABEL ? `${label.slice(0, MAX_LABEL - 1)}…` : label;
  } catch {
    return url.length > MAX_LABEL ? `${url.slice(0, MAX_LABEL - 1)}…` : url;
  }
};

const LinkText = ({ text, className, domainOnly = false }) => {
  if (!text) return null;

  const parts = [];
  let last = 0;
  let m;
  URL_RE.lastIndex = 0;
  while ((m = URL_RE.exec(text)) !== null) {
    const start = m.index;
    const url = m[0].replace(TRAILING_RE, '');
    if (!url) {
      URL_RE.lastIndex = start + m[0].length;
      continue;
    }
    if (start > last) parts.push(text.slice(last, start));
    const href = url.startsWith('http') ? url : `https://${url}`;
    parts.push(
      <a
        key={start}
        className={styles.link}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={url}
        onClick={(e) => e.stopPropagation()}
      >
        {shortenUrl(url, domainOnly)}
      </a>,
    );
    last = start + url.length;
    URL_RE.lastIndex = last;
  }
  if (last < text.length) parts.push(text.slice(last));

  return <p className={className}>{parts}</p>;
};

export default LinkText;
