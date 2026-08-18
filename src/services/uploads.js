/**
 * Прямая загрузка файлов в S3 по presigned URL: бэкенд только подписывает URL
 * (ручки /presign и /confirm), сам файл через него не проходит.
 * Нарочно мимо apiClient: Bearer-заголовок в запросе к S3 не нужен,
 * а Content-Type входит в подпись — заголовок должен совпадать с presign-запросом.
 */
export const uploadToS3 = (uploadUrl, file, onProgress) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    if (file.type) xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`S3 ответил ${xhr.status}`));
    xhr.onerror = () => reject(new Error('Не удалось загрузить в S3 (проверьте CORS на бакете)'));
    xhr.send(file);
  });
