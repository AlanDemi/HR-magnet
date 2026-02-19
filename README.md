# HR Magnet Bot (JobFair Assistant)

**HR Magnet** — это умный Telegram-бот с веб-интерфейсом (Mini App) для автоматизации подбора персонала на ярмарках вакансий. Бот принимает резюме (PDF, DOCX, фото), извлекает из них данные с помощью ИИ, анализирует навыки кандидата и автоматически подбирает наиболее подходящие вакансии.

![Tech Stack](https://img.shields.io/badge/Python-3.11+-blue.svg) ![Tech Stack](https://img.shields.io/badge/FastAPI-0.115+-green.svg) ![Tech Stack](https://img.shields.io/badge/React-18+-61DAFB.svg) ![Tech Stack](https://img.shields.io/badge/AI-Ollama-orange.svg)

---

## 🚀 Основные возможности

### 1. 📄 Парсинг резюме (AI-Powered)
- **Поддержка форматов:** PDF, DOCX, Изображения (JPG, PNG).
- **Умное извлечение:**
  - Извлекает **Имя**, **Контакты**, **Навыки**, **Опыт работы** и **Краткое резюме**.
  - Работает даже со сложной версткой (таблицы, колонки, сканы).
  - Использует гибридный подход: **Tesseract / PyMuPDF** для текста + **Vision Models** (Llama 3.2 Vision) для сложных случаев.

### 2. 🎯 Автоматический мэтчинг (Matching)
- Анализирует навыки кандидата и сравнивает их с требованиями вакансий (`data/jobs.json`).
- Выдает список подходящих вакансий с процентом соответствия (например: "Junior Python Backend - 95%").
- Учитывает синонимы технологий (JS = JavaScript, React.js = React).

### 3. 📱 Telegram Mini App (Frontend)
- Встроенное веб-приложение прямо в Telegram.
- **Wizard Form:** Пошаговая анкета для кандидатов без резюме.
- **Results Screen:** Красивое отображение результатов анализа и подходящих вакансий.
- **Admin Dashboard:** Панель рекрутера для просмотра всех заявок, статистики и скачивания резюме.

- **Локально:** Поддержка **Ollama** (Llama 3, Llama 3.2 Vision) для полной приватности данных.

---

## 🛠 Технологический стек

### Backend (Python)
- **FastAPI:** Высокопроизводительный API для фронтенда.
- **Aiogram 3:** Асинхронный фреймворк для Telegram-бота.
- **SQLAlchemy + aiosqlite:** Асинхронная работа с базой данных (SQLite).
- **Pydantic:** Валидация данных.
- **Библиотеки:** `PyMuPDF` (PDF), `python-docx` (Word), `Pillow` (Изображения).

### Frontend (TypeScript + React)
- **Vite:** Сборщик проекта.
- **React 18:** Библиотека интерфейсов.
- **TailwindCSS:** Стилизация.
- **Lucide React:** Иконки.
- **Telegram Web App SDK:** Интеграция с Telegram.

---

## 📥 Установка и запуск (Локально)

### Предварительные требования
- Python 3.10+
- Node.js 18+
- Установленный [Ollama](https://ollama.com/) (для локальной работы ИИ).

### 1. Клонирование репозитория
```bash
git clone https://github.com/AlanDemi/HR-magnet.git
cd HR-magnet
```

### 2. Настройка Backend
Создайте виртуальное окружение и установите зависимости:
```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux/Mac
source .venv/bin/activate

pip install -r requirements.txt
```

Создайте файл `.env` в корне проекта (см. пример ниже) и настройте его.

### 3. Настройка Frontend
Перейдите в папку фронтенда и установите зависимости:
```bash
cd frontend
npm install
```

### 4. Запуск проекта
Вы можете запустить всё одной командой (если настроен скрипт) или через терминалы:

**Терминал 1 (Бэкенд + Бот):**
```bash
python -m app.main
```

**Терминал 2 (Фронтенд Dev-режим):**
```bash
cd frontend
npm run dev
```

---

## ⚙️ Конфигурация (.env)

| Переменная | Описание | Значение по умолчанию |
|------------|----------|-----------------------|
| `TELEGRAM_BOT_TOKEN` | Токен вашего бота от @BotFather | - |
| `OLLAMA_URL` | URL локального Ollama | `http://localhost:11434/api/generate` |
| `WEBAPP_URL` | URL вашего Mini App (https) | `https://ваш-домен.com` |
| `API_HOST` | Хост сервера | `0.0.0.0` |
| `API_PORT` | Порт сервера | `8000` |

---

## ☁️ Деплой на Render.com

Для деплоя используется ветка `render-deploy`. В ней настроена автоматическая сборка React-приложения и запуск Python-сервера, который раздает статику.

1. Создайте Web Service на Render.
2. Подключите репозиторий.
3. Укажите Build Command: `bash build.sh`
4. Укажите Start Command: `python -m app.main`
5. Добавьте переменные окружения (`TELEGRAM_BOT_TOKEN`, `PYTHON_VERSION=3.11.0`, `NODE_VERSION=20.10.0`).

---

## 📂 Структура проекта

```graphql
HR-magnet/
├── app/
│   ├── bot.py             # Логика Telegram бота
│   ├── main.py            # Точка входа (FastAPI + Bot)
│   ├── database.py        # Настройки БД
│   ├── models.py          # SQLAlchemy модели
│   ├── config.py          # Конфигурация
│   ├── routers/           # API эндпоинты
│   └── services/
│        ├── ai_service.py     # Логика работы с ИИ (Ollama)
│       ├── matcher.py        # Алгоритм подбора вакансий
│       └── text_extractor.py # Парсинг файлов (OCR, PDF, DOCX)
├── data/
│   └── jobs.json          # База вакансий для мэтчинга
├── frontend/              # React приложение
│   ├── src/
│   ├── public/
│   └── vite.config.ts
├── uploads/               # Сохраненные резюме
├── requirements.txt       # Python зависимости
└── README.md              # Документация
```
