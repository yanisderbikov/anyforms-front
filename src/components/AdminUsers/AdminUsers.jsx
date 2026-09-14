import React, { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../../apiClient';
import { authHeaders, formatDate, RefreshButton } from '../AdminInvoices/invoiceShared';
import styles from './AdminUsers.module.css';

const ROLES = [
  { value: 'ADMIN', label: 'админ — всё' },
  { value: 'SALES_MANAGER', label: 'менеджер продаж — заказы, счета' },
  { value: 'PROJECT_MANAGER', label: 'менеджер проектов — заказы' },
];

const ROLE_LABELS = Object.fromEntries(ROLES.map((r) => [r.value, r.label.split(' — ')[0]]));

const emptyForm = { email: '', name: '', role: 'SALES_MANAGER' };

const apiError = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [busyId, setBusyId] = useState(null);

  const me = useOutletContext()?.email;

  const loadUsers = useCallback(async () => {
    try {
      const res = await apiClient.instance.get('/api/admin-users', { headers: authHeaders() });
      setUsers(Array.isArray(res.data) ? res.data : []);
      setPageError('');
    } catch (err) {
      setPageError(apiError(err, 'Не удалось загрузить пользователей'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadUsers();
    } finally {
      setRefreshing(false);
    }
  };

  const setField = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    const name = form.name.trim();
    if (!email) return setError('Укажите почту.');
    if (!name) return setError('Укажите имя — оно показывается в приветствии админки.');

    setSaving(true);
    setError('');
    try {
      await apiClient.instance.post('/api/admin-users', { email, name, role: form.role }, { headers: authHeaders() });
      toast.success(`Доступ выдан: ${email}`);
      setForm(emptyForm);
      await loadUsers();
    } catch (err) {
      setError(apiError(err, 'Не удалось выдать доступ'));
    } finally {
      setSaving(false);
    }
  };

  const updateUser = async (user, patch) => {
    setBusyId(user.id);
    try {
      await apiClient.instance.put(
        `/api/admin-users/${user.id}`,
        { name: user.name, role: user.role, ...patch },
        { headers: authHeaders() },
      );
      toast.success(`Сохранено: ${user.email}`);
      await loadUsers();
    } catch (err) {
      toast.error(apiError(err, 'Не удалось сохранить'));
    } finally {
      setBusyId(null);
    }
  };

  const handleRoleChange = (user, role) => {
    if (role === user.role) return;
    updateUser(user, { role });
  };

  const handleRename = (user) => {
    const name = window.prompt(`Имя для ${user.email}`, user.name || '');
    if (name == null) return;
    const trimmed = name.trim();
    if (!trimmed || trimmed === user.name) return;
    updateUser(user, { name: trimmed });
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Отозвать доступ у ${user.email}? Человек сразу вылетит из админки.`)) return;
    setBusyId(user.id);
    try {
      await apiClient.instance.delete(`/api/admin-users/${user.id}`, { headers: authHeaders() });
      toast.success(`Доступ отозван: ${user.email}`);
      await loadUsers();
    } catch (err) {
      toast.error(apiError(err, 'Не удалось отозвать доступ'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Доступы в админку</h1>
      <p className={styles.lead}>
        Вход — по коду на почту. Человек сможет войти сразу после того, как его почта появится в списке ниже.
        Страница скрытая: в меню её нет, видит только супер-админ.
      </p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.formTitle}>Выдать доступ</h2>
        <div className={styles.formGrid}>
          <label className={styles.label}>
            Почта *
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={setField}
              className={styles.input}
              placeholder="manager@anyforms.ru"
              autoComplete="off"
              required
            />
          </label>
          <label className={styles.label}>
            Имя *
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={setField}
              className={styles.input}
              placeholder="Юра"
              autoComplete="off"
              required
            />
          </label>
          <label className={styles.label}>
            Роль
            <select name="role" value={form.role} onChange={setField} className={styles.input}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.formActions}>
          <button type="submit" className={styles.submit} disabled={saving}>
            {saving ? 'Сохранение…' : 'Выдать доступ'}
          </button>
        </div>
      </form>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Кто может входить</h2>
          <RefreshButton onClick={handleRefresh} refreshing={refreshing} label="Обновить список пользователей" />
        </div>
        {pageError && <p className={styles.banner}>{pageError}</p>}
        {loading ? (
          <p className={styles.message}>Загрузка…</p>
        ) : users.length === 0 ? (
          <p className={styles.message}>Пока никого нет.</p>
        ) : (
          <ul className={styles.list}>
            {users.map((u) => {
              const busy = busyId === u.id;
              return (
                <li key={u.id} className={`${styles.item} ${busy ? styles.itemBusy : ''}`}>
                  <div className={styles.itemMain}>
                    <div className={styles.itemHead}>
                      <span className={styles.email}>{u.email}</span>
                      {u.superAdmin && <span className={`${styles.badge} ${styles.badgeSuper}`}>супер-админ</span>}
                      {u.email === me && !u.superAdmin && <span className={styles.badge}>это вы</span>}
                    </div>
                    <p className={styles.meta}>
                      {u.name || 'без имени'}
                      {' · '}
                      {u.lastLoginAt ? `последний вход ${formatDate(u.lastLoginAt)}` : 'ещё не входил'}
                      {u.createdAt ? ` · добавлен ${formatDate(u.createdAt)}` : ''}
                    </p>
                  </div>
                  <div className={styles.actions}>
                    {u.superAdmin ? (
                      <span className={styles.roleFixed}>{ROLE_LABELS[u.role] || u.role}</span>
                    ) : (
                      <select
                        className={styles.roleSelect}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                        disabled={busy}
                        aria-label={`Роль ${u.email}`}
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {ROLE_LABELS[r.value]}
                          </option>
                        ))}
                      </select>
                    )}
                    <button type="button" className={styles.editBtn} onClick={() => handleRename(u)} disabled={busy}>
                      Имя
                    </button>
                    {!u.superAdmin && (
                      <button type="button" className={styles.deleteBtn} onClick={() => handleDelete(u)} disabled={busy}>
                        Отозвать
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default AdminUsers;
