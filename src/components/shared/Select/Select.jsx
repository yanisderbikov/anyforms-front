import React from 'react';
import styles from './Select.module.css';

const Select = ({ pill = false, className = '', children, ...props }) => {
  const classes = [styles.select, pill ? styles.pill : '', className].filter(Boolean).join(' ');
  return (
    <select className={classes} {...props}>
      {children}
    </select>
  );
};

export default Select;
