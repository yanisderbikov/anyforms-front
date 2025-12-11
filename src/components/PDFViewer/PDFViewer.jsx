import React from 'react';
import styles from './PDFViewer.module.css';

const PDFViewer = () => {
  return (
    <div className={styles.pdfContainer}>
      <iframe
        src="/anyforms.pdf"
        title="AnyForms PDF"
        className={styles.pdfFrame}
      />
    </div>
  );
};

export default PDFViewer;
