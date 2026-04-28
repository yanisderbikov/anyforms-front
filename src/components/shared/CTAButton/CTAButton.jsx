import React from 'react';
import styles from './CTAButton.module.css';

const CTAButton = ({
  href,
  onClick,
  children,
  target,
  rel,
  type = 'button',
  disabled = false,
  className = '',
}) => {
  const classes = `${styles.cta} ${className}`.trim();

  if (href) {
    return (
      <a className={classes} href={href} target={target} rel={rel}>
        {children}
        <span className={styles.ctaArrow} aria-hidden>
          →
        </span>
      </a>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled}>
      {children}
      <span className={styles.ctaArrow} aria-hidden>
        →
      </span>
    </button>
  );
};

export default CTAButton;
