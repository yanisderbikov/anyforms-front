# Инструкция по деплою на GitHub Pages

## Подготовка

1. Убедитесь, что у вас установлен Node.js (версия 14 или выше)
2. Установите зависимости:
   ```bash
   npm install
   ```

## Настройка GitHub Pages

1. Откройте `package.json` и замените `yourusername` на ваш GitHub username в поле `homepage`:
   ```json
   "homepage": "https://ваш-username.github.io/anyforms-front"
   ```

2. Или если вы используете кастомный домен:
   ```json
   "homepage": "https://ваш-домен.com"
   ```

## Деплой

1. Убедитесь, что все изменения закоммичены:
   ```bash
   git add .
   git commit -m "Initial commit"
   ```

2. Добавьте remote репозиторий (если еще не добавлен):
   ```bash
   git remote add origin https://github.com/ваш-username/anyforms-front.git
   ```

3. Запушите код в репозиторий:
   ```bash
   git push -u origin main
   ```

4. Выполните деплой:
   ```bash
   npm run deploy
   ```

После выполнения команды `npm run deploy`:
- Проект будет собран (`npm run build`)
- Создастся ветка `gh-pages` с собранными файлами
- Файлы будут загружены на GitHub Pages

## Проверка деплоя

Через несколько минут ваше приложение будет доступно по адресу:
`https://ваш-username.github.io/anyforms-front`

## API Endpoints

- **Development**: `http://localhost:8090`
- **Production**: `https://anyforms.railways`

API endpoint автоматически определяется в зависимости от окружения.

## Обновление после изменений

После любых изменений в коде:

1. Закоммитьте изменения:
   ```bash
   git add .
   git commit -m "Описание изменений"
   git push
   ```

2. Выполните деплой:
   ```bash
   npm run deploy
   ```

## Troubleshooting

### Проблема: Страница не загружается

- Проверьте, что в `package.json` указан правильный `homepage`
- Убедитесь, что в настройках репозитория GitHub Pages включена ветка `gh-pages`
- Подождите несколько минут - GitHub Pages может обновляться с задержкой

### Проблема: API запросы не работают

- Проверьте, что API сервер доступен
- Проверьте CORS настройки на сервере
- Убедитесь, что в production используется правильный URL: `https://anyforms.railways`



