import React, { useEffect, useRef } from 'react';
import { sendPreviewEdit, sendPreviewFocus } from './shopPreview';
import styles from './Marketplace.module.css';

const PreviewText = ({ as: Tag, field, value, placeholder, className, multiline = false }) => {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.innerText !== value) el.innerText = value;
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, multiline ? text : text.replace(/\s*\n\s*/g, ' '));
  };

  const handleBlur = (e) => {
    if (e.currentTarget.innerText !== value) e.currentTarget.innerText = value;
  };

  return (
    <Tag
      ref={ref}
      className={`${className} ${styles.previewEditable}`}
      contentEditable
      suppressContentEditableWarning
      spellCheck
      data-placeholder={placeholder}
      onInput={(e) => sendPreviewEdit(field, e.currentTarget.innerText.replace(/\n$/, ''))}
      onFocus={() => sendPreviewFocus(field)}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onBlur={handleBlur}
    />
  );
};

export default PreviewText;
