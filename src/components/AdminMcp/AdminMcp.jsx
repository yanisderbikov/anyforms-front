import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import { MCP_SERVER_URL, requestMcpCode, verifyMcpCode } from '../../services/mcp';
import styles from '../AdminPromoCodes/AdminPromoCodes.module.css';
import own from './AdminMcp.module.css';

const RESEND_SECONDS = 60;
const TOKEN_DAYS = 30;

const TOOLS = [
  ['list_custom_orders', 'заказы под заказ в работе'],
  ['get_custom_order', 'заказ со всеми позициями'],
  ['list_custom_items', 'позиции, можно по статусу'],
  ['get_custom_item', 'позиция по id или публичному номеру'],
  ['get_item_logs', 'лог производства позиции'],
  ['list_ready_to_ship', 'что готово к отправке'],
  ['list_in_delivery', 'что сейчас в доставке'],
  ['list_retail_orders', 'розница без трекера: дата оплаты, комментарий, товары'],
  ['get_sales_analytics', 'продажи за период по магазинам: заказы, молды, средний чек, сумма'],
  ['set_item_status', 'сменить статус позиции: моделирование, в производстве, готов к отправке'],
  ['add_item_log', 'добавить запись в лог производства'],
];

const apiError = (err, fallback) =>
  err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback;

const claudeCodeCommand = (token) =>
  `claude mcp add --transport http anyforms ${MCP_SERVER_URL} --header "Authorization: Bearer ${token}"`;

const mcpJson = (token) =>
  JSON.stringify(
    {
      mcpServers: {
        anyforms: {
          type: 'http',
          url: MCP_SERVER_URL,
          headers: { Authorization: `Bearer ${token}` },
        },
      },
    },
    null,
    2
  );

const CopyBlock = ({ label, text }) => {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Скопировано');
    } catch {
      toast.error('Не удалось скопировать — выделите текст вручную');
    }
  };

  return (
    <div className={own.copyBlock}>
      <div className={own.copyHead}>
        <span className={styles.label}>{label}</span>
        <button type="button" className={styles.generateBtn} onClick={copy}>
          копировать
        </button>
      </div>
      <pre className={own.code}>{text}</pre>
    </div>
  );
};

const AdminMcp = () => {
  const email = useOutletContext()?.email || '';
  const [step, setStep] = useState('start');
  const [code, setCode] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const sendCode = async () => {
    if (!email) {
      setError('Не удалось определить вашу почту — перезайдите в админку');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await requestMcpCode(email);
      setCode('');
      setStep('code');
      setResendIn(RESEND_SECONDS);
    } catch (err) {
      setError(apiError(err, 'Не удалось отправить код. Попробуйте ещё раз.'));
    } finally {
      setLoading(false);
    }
  };

  const confirmCode = async (e) => {
    e.preventDefault();
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) {
      setError('Код — 6 цифр из письма');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await verifyMcpCode(email, digits);
      if (!data?.token) {
        throw new Error('В ответе сервера нет токена');
      }
      setToken(data.token);
      setStep('done');
    } catch (err) {
      setError(apiError(err, 'Неверный код. Проверьте письмо.'));
    } finally {
      setLoading(false);
    }
  };

  const startOver = () => {
    setToken('');
    setCode('');
    setError('');
    setStep('start');
  };

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Подключение Claude</h1>

      <section className={styles.form}>
        <h2 className={styles.formTitle}>Что получит Claude</h2>
        <p className={own.text}>
          Доступ к заказам под заказ: Claude может смотреть заказы, позиции, логи и что готово к отправке.
          Розницу без трекера и аналитику продаж по магазинам — только смотреть. Телефоны клиентов Claude не получает.
          Менять может <strong>только статус позиции и лог производства</strong> — обе правки уходят примечанием
          в сделку amoCRM от вашего имени. Отправку с трекером, удаление и остальное Claude не делает.
          Подключиться могут только администраторы.
        </p>
        <ul className={own.tools}>
          {TOOLS.map(([name, label]) => (
            <li key={name}>
              <code className={own.toolName}>{name}</code> — {label}
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.form}>
        <h2 className={styles.formTitle}>Получить токен</h2>

        {step === 'start' && (
          <>
            <p className={own.text}>
              Пришлём код на <strong>{email || 'вашу почту'}</strong>. Токен действует {TOKEN_DAYS} дней и перестаёт
              работать сразу, если у вас заберут роль администратора.
            </p>
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.formActions}>
              <button type="button" className={styles.submit} onClick={sendCode} disabled={loading}>
                {loading ? 'Отправляем…' : 'Отправить код'}
              </button>
            </div>
          </>
        )}

        {step === 'code' && (
          <form onSubmit={confirmCode}>
            <p className={own.text}>
              Код отправлен на <strong>{email}</strong>.
            </p>
            <label className={styles.label}>
              Код из письма
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className={`${styles.input} ${own.codeInput}`}
                autoComplete="one-time-code"
                inputMode="numeric"
                maxLength={6}
                placeholder="······"
                disabled={loading}
                autoFocus
              />
            </label>
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.formActions}>
              <button type="submit" className={styles.submit} disabled={loading}>
                {loading ? 'Проверяем…' : 'Получить токен'}
              </button>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={sendCode}
                disabled={loading || resendIn > 0}
              >
                {resendIn > 0 ? `ещё раз через ${resendIn} с` : 'отправить ещё раз'}
              </button>
            </div>
          </form>
        )}

        {step === 'done' && (
          <>
            <p className={own.text}>
              Готово. Токен показываем один раз — скопируйте нужный вариант сейчас. Он действует {TOKEN_DAYS} дней,
              потом получите новый здесь же.
            </p>
            <CopyBlock label="Claude Code — выполните в терминале" text={claudeCodeCommand(token)} />
            <CopyBlock label="или файл .mcp.json в папке проекта" text={mcpJson(token)} />
            <p className={own.text}>
              После подключения просто спросите Claude, например: «что у нас готово к отправке?»
            </p>
            <div className={styles.formActions}>
              <button type="button" className={styles.cancelBtn} onClick={startOver}>
                получить другой токен
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default AdminMcp;
