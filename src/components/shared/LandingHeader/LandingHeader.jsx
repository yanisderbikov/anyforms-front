import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './LandingHeader.module.css';

const renderItemContent = (item, className, onItemClick) => {
  if (item.kind === 'button') {
    return (
      <button
        type={item.buttonType || 'button'}
        className={className}
        onClick={(event) => {
          item.onClick?.(event);
          onItemClick();
        }}
      >
        {item.label}
      </button>
    );
  }

  if (item.to) {
    return (
      <Link
        className={className}
        to={item.to}
        onClick={(event) => {
          item.onClick?.(event);
          onItemClick();
        }}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <a
      className={className}
      href={item.href}
      target={item.target}
      rel={item.rel}
      onClick={(event) => {
        item.onClick?.(event);
        onItemClick();
      }}
    >
      {item.label}
    </a>
  );
};

const getRightItemClassName = (variant) => {
  if (variant === 'phone') return styles.headerPhone;
  if (variant === 'pill') return `${styles.navLink} ${styles.navLinkPill}`;
  return styles.navLink;
};

const getMobileItemClassName = (variant) => {
  if (variant === 'primary') return `${styles.mobileMenuLink} ${styles.mobileMenuPrimary}`;
  return styles.mobileMenuLink;
};

const LandingHeader = ({
  logo,
  navLinks,
  navAriaLabel,
  rightItems = [],
  mobileMenuId,
  mobileLinks,
  mobileTopItems = [],
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileNavLinks = useMemo(() => mobileLinks || navLinks, [mobileLinks, navLinks]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined;
    }
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <header className={styles.siteHeader}>
        <div className={styles.siteHeaderInner}>
          <a
            className={styles.logoLink}
            href={logo.href}
            onClick={logo.onClick}
            aria-label={logo.ariaLabel}
          >
            <img
              className={styles.logo}
              src={logo.src}
              alt={logo.alt || ''}
              width={logo.width}
              height={logo.height}
              decoding="async"
            />
          </a>

          <nav className={styles.headerNav} aria-label={navAriaLabel}>
            {navLinks.map((item) => (
              <React.Fragment key={item.key || item.label}>
                {renderItemContent(item, styles.navLink, closeMobileMenu)}
              </React.Fragment>
            ))}
          </nav>

          <div className={styles.headerContact}>
            {rightItems.map((item) => (
              <React.Fragment key={item.key || item.label}>
                {renderItemContent(item, getRightItemClassName(item.variant), closeMobileMenu)}
              </React.Fragment>
            ))}
          </div>

          <button
            type="button"
            className={styles.burgerButton}
            aria-label={isMobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={isMobileMenuOpen}
            aria-controls={mobileMenuId}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            <span className={styles.burgerLine} />
            <span className={styles.burgerLine} />
            <span className={styles.burgerLine} />
          </button>
        </div>
      </header>

      <div
        id={mobileMenuId}
        className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}
      >
        <div className={styles.mobileMenuInner}>
          {mobileTopItems.map((item) => (
            <React.Fragment key={item.key || item.label}>
              {renderItemContent(item, getMobileItemClassName(item.variant), closeMobileMenu)}
            </React.Fragment>
          ))}
          {mobileNavLinks.map((item) => (
            <React.Fragment key={item.key || item.label}>
              {renderItemContent(item, styles.mobileMenuLink, closeMobileMenu)}
            </React.Fragment>
          ))}
        </div>
      </div>
    </>
  );
};

export default LandingHeader;
