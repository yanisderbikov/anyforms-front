import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './Login.module.css';
import apiClient from '../../apiClient';

const RESEND_SECONDS = 60;

const errorMessage = (err, fallback) =>
  err.response?.data?.message || err.response?.data?.error || err.message || fallback;

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const requestCode = async () => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) {
      setError('Введите почту');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiClient.instance.post('/api/auth/request-code', { email: normalized });
      setEmail(normalized);
      setCode('');
      setStep('code');
      setResendIn(RESEND_SECONDS);
    } catch (err) {
      setError(errorMessage(err, 'Не удалось отправить код. Попробуйте ещё раз.'));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) {
      setError('Код — 6 цифр из письма');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.instance.post('/api/auth/verify-code', { email, code: digits });
      if (!data?.token) {
        throw new Error('В ответе сервера нет токена');
      }
      apiClient.setToken(data.token);
      // Возвращаем туда, куда человек шёл до логина; иначе — на домашнюю страницу админки.
      const from = searchParams.get('from');
      const target = from && from.startsWith('/') && !from.startsWith('//') ? from : '/admin';
      navigate(target, { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Неверный код. Проверьте письмо.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 'email') {
      requestCode();
    } else {
      verifyCode();
    }
  };

  const backToEmail = () => {
    setStep('email');
    setCode('');
    setError('');
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Вход</h1>
        <p className={styles.subtitle}>anyforms</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          {step === 'email' ? (
            <label className={styles.label}>
              Почта
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                autoComplete="email"
                inputMode="email"
                disabled={loading}
                autoFocus
              />
            </label>
          ) : (
            <>
              <p className={styles.hint}>
                Если у <strong>{email}</strong> есть доступ, код уже в почте.{' '}
                <button type="button" className={styles.linkBtn} onClick={backToEmail} disabled={loading}>
                  Другая почта
                </button>
              </p>
              <label className={styles.label}>
                Код из письма
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={`${styles.input} ${styles.codeInput}`}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="······"
                  disabled={loading}
                  autoFocus
                />
              </label>
            </>
          )}
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? 'Секунду…' : step === 'email' ? 'Получить код' : 'Войти'}
          </button>
          {step === 'code' && (
            <button
              type="button"
              className={styles.resend}
              onClick={requestCode}
              disabled={loading || resendIn > 0}
            >
              {resendIn > 0 ? `Отправить код ещё раз через ${resendIn} с` : 'Отправить код ещё раз'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default Login;
