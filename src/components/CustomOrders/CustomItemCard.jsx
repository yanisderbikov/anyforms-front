import React from 'react';
import { CUSTOM_STATUS_LABELS, isImageFile, fileExt } from '../../services/customProducts';
import styles from './CustomItemCard.module.css';

const CustomItemCard = ({ item, onOpen, hideStatus }) => {
  const files = item.files || [];
  const first = files[0];

  return (
    <div className={styles.card} onClick={onOpen}>
      <div className={styles.preview}>
        {first ? (
          isImageFile(first) ? (
            <img className={styles.previewImg} src={first.url} alt="" loading="lazy" decoding="async" />
          ) : (
            <div className={styles.fileBox}>
              <span className={styles.fileExt}>{fileExt(first)}</span>
            </div>
          )
        ) : (
          <div className={styles.noPhoto}>нет файлов</div>
        )}

        {files.length > 1 && <span className={styles.count}>+{files.length - 1}</span>}
        {!hideStatus && item.status && (
          <span className={styles.status}>{CUSTOM_STATUS_LABELS[item.status] || item.status}</span>
        )}
      </div>

      <div className={styles.body}>
        <span className={styles.name} title={item.productName}>{item.productName || 'без названия'}</span>
        <span className={styles.qty}>× {item.quantity}</span>
      </div>
    </div>
  );
};

export default CustomItemCard;
