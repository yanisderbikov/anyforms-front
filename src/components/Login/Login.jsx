import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './Login.module.css';
import apiClient from "../../apiClient";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function login(loginValue, password) {
    const request = {
      username: loginValue,
      password: password
    }
    console.log(`request ${JSON.stringify(request, null, 2)}`)
    const response = await apiClient.api.login(request);
    console.log(`response ${JSON.stringify(response, null, 2)}`)

    const token = response.data.token;
    if (!token) {
      throw new Error('В ответе сервера нет токена');
    }
    apiClient.setToken(token);
    return token;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!loginValue.trim() || !password) {
      setError('Введите логин и пароль');
      return;
    }
    setLoading(true);
    try {
      await login(loginValue.trim(), password);
      // Возвращаем туда, куда человек шёл до логина; иначе — на доску под заказов.
      const from = searchParams.get('from');
      const target = from && from.startsWith('/') && !from.startsWith('//') ? from : '/orders/custom';
      navigate(target, { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Ошибка входа. Проверьте логин и пароль.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <h1 className={styles.title}>Вход</h1>
        <p className={styles.subtitle}>anyforms</p>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Логин
            <input
              type="text"
              value={loginValue}
              onChange={(e) => setLoginValue(e.target.value)}
              className={styles.input}
              autoComplete="username"
              disabled={loading}
              autoFocus
            />
          </label>
          <label className={styles.label}>
            Пароль
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              autoComplete="current-password"
              disabled={loading}
            />
          </label>
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? 'Вход…' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
