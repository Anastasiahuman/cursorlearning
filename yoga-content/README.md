# Yoga Content - Структура контента приложения

Эта папка содержит всю структуру контента для йога-приложения: схемы, шаблоны, программы, категории и скрипты.

---

## Структура папок

```
yoga-content/
├── README.md                   # Этот файл
│
├── schemas/                    # JSON Schema для валидации
│   ├── lesson.schema.json      # Схема урока
│   └── program.schema.json     # Схема программы
│
├── templates/                  # Шаблоны для создания контента
│   ├── lesson_template.json    # Шаблон урока
│   └── program_template.json   # Шаблон программы
│
├── config/                     # Конфигурация
│   └── lessons_config.json     # Конфигурация 40 уроков для импорта
│
├── programs/                   # Готовые программы (5 штук)
│   ├── healthy_back_21days.json
│   ├── splits_journey.json
│   ├── hip_opening.json
│   ├── antistress.json
│   └── full_flexibility.json
│
├── categories/                 # Категории (5 штук)
│   ├── back_health.json
│   ├── flexibility.json
│   ├── hip_joints.json
│   ├── meditation.json
│   └── relaxation.json
│
├── scripts/                    # Python скрипты
│   ├── import_lessons.py       # Импорт уроков из видео
│   ├── validate_content.py     # Валидация контента
│   └── generate_thumbnails.py  # Генерация превью из видео
│
└── content/                    # Контент (создастся после импорта)
    ├── lessons/                # 40 уроков
    │   ├── 001_lesson_name/
    │   │   ├── metadata.json
    │   │   ├── video.mp4
    │   │   ├── thumbnail.jpg
    │   │   └── description.md
    │   └── ...
    │
    ├── programs/               # Превью программ
    │   ├── healthy_back_21days/
    │   │   └── thumbnail.jpg
    │   └── ...
    │
    └── categories/             # Иконки категорий
        ├── spine.svg
        ├── stretch.svg
        └── ...
```

---

## Быстрый старт

### 1. Установка зависимостей

```bash
pip install jsonschema
brew install ffmpeg  # для генерации превью (macOS)
```

### 2. Подготовка видео

Положите 40 видео-файлов в папку `../source_videos/`:
- Названия: `lesson_001.mp4`, `lesson_002.mp4`, ..., `lesson_040.mp4`
- Формат: MP4 (H.264)
- Разрешение: минимум 1280x720

### 3. Импорт уроков

```bash
cd yoga-content

python scripts/import_lessons.py \
  --source ../source_videos \
  --output ./content/lessons \
  --schema ./schemas/lesson.schema.json \
  --config ./config/lessons_config.json
```

### 4. Генерация превью

```bash
python scripts/generate_thumbnails.py \
  --input ./content/lessons
```

### 5. Валидация

```bash
python scripts/validate_content.py \
  --content ./content \
  --schemas ./schemas
```

---

## Схемы данных

### Lesson (Урок)

Основные поля:
- `id` - уникальный ID (001-040)
- `title` - название урока
- `category` - категория (back_health, flexibility, hip_joints, meditation, relaxation)
- `level` - уровень сложности (1-3)
- `duration` - длительность в минутах
- `video_url` - путь к видео
- `thumbnail_url` - путь к превью
- `instructor` - имя инструктора
- `tags` - теги для поиска
- `poses` - список асан
- `benefits` - польза от практики
- `equipment` - необходимое оборудование

Полная схема: `schemas/lesson.schema.json`

### Program (Программа)

Основные поля:
- `id` - уникальный ID (prog_001, prog_002, ...)
- `title` - название программы
- `duration_weeks` - длительность в неделях
- `lessons` - массив ID уроков
- `schedule` - расписание по дням
- `goal` - цель программы
- `level` - уровень сложности

Полная схема: `schemas/program.schema.json`

---

## Категории

### 1. Здоровье спины (back_health)
- Уроки: 001-012 (12 штук)
- Цвет: #4CAF50 (зелёный)
- Фокус: снятие болей, укрепление позвоночника

### 2. Гибкость (flexibility)
- Уроки: 013-022 (10 штук)
- Цвет: #FF9800 (оранжевый)
- Фокус: растяжка, шпагаты

### 3. Тазобедренные суставы (hip_joints)
- Уроки: 023-030 (8 штук)
- Цвет: #9C27B0 (фиолетовый)
- Фокус: раскрытие таза, подготовка к лотосу

### 4. Медитация (meditation)
- Уроки: 031-035 (5 штук)
- Цвет: #2196F3 (синий)
- Фокус: осознанность, дыхание

### 5. Релаксация (relaxation)
- Уроки: 036-040 (5 штук)
- Цвет: #00BCD4 (голубой)
- Фокус: расслабление, йога-нидра

---

## Программы

### 1. Здоровая спина за 21 день
- ID: prog_001
- Длительность: 3 недели
- Уроки: 7 (001-007)
- Тип: Бесплатная

### 2. Путь к шпагату
- ID: prog_002
- Длительность: 8 недель
- Уроки: 6 (013, 014, 016, 017, 020, 021)
- Тип: Premium

### 3. Раскрытие тазобедренных суставов
- ID: prog_003
- Длительность: 6 недель
- Уроки: 6 (023-028)
- Тип: Premium

### 4. Антистресс
- ID: prog_004
- Длительность: 2 недели
- Уроки: 6 (031, 032, 033, 036, 037, 038)
- Тип: Бесплатная

### 5. Полная гибкость
- ID: prog_005
- Длительность: 12 недель
- Уроки: 10 (013-022)
- Тип: Premium

---

## Скрипты

### import_lessons.py

Импортирует видео-уроки и создаёт структуру контента.

**Функции:**
- Копирование видео файлов
- Создание папок для уроков
- Генерация metadata.json
- Создание description.md
- Валидация по JSON Schema
- Генерация индексного файла

**Использование:**
```bash
python scripts/import_lessons.py \
  --source /path/to/videos \
  --output ./content/lessons \
  --schema ./schemas/lesson.schema.json \
  --config ./config/lessons_config.json
```

### validate_content.py

Проверяет корректность всего контента.

**Проверки:**
- Валидация метаданных по схемам
- Наличие файлов (видео, превью, описания)
- Ссылки между уроками и программами
- Корректность длительности и других параметров
- Генерация отчёта

**Использование:**
```bash
python scripts/validate_content.py \
  --content ./content \
  --schemas ./schemas
```

### generate_thumbnails.py

Генерирует превью изображения из видео.

**Функции:**
- Извлечение кадра из видео (5-я секунда или 1/4 длительности)
- Масштабирование до 1280x720
- Пакетная обработка всех уроков
- Проверка наличия ffmpeg

**Использование:**
```bash
python scripts/generate_thumbnails.py \
  --input ./content/lessons
```

---

## Добавление нового урока

1. Добавьте метаданные в `config/lessons_config.json`:
```json
{
  "id": "041",
  "title": "Новый урок",
  "category": "back_health",
  "level": 1,
  "duration": 20,
  ...
}
```

2. Положите видео в `source_videos/lesson_041.mp4`

3. Запустите импорт:
```bash
python scripts/import_lessons.py --source ../source_videos --output ./content/lessons --config ./config/new_lesson.json
```

---

## Добавление новой программы

1. Создайте файл в `programs/new_program.json` по шаблону `templates/program_template.json`

2. Заполните все поля, особенно:
   - `lessons` - массив ID уроков
   - `schedule` - расписание по дням

3. Запустите валидацию:
```bash
python scripts/validate_content.py --content ./content --schemas ./schemas
```

---

## API для разработчиков

### Получение списка уроков

```javascript
// GET /api/lessons?category=back_health&level=1

{
  "total": 4,
  "lessons": [
    {
      "id": "001",
      "title": "Базовая разминка для спины",
      "duration": 15,
      "level": 1,
      "category": "back_health",
      "thumbnailUrl": "https://cdn.example.com/lessons/001/thumbnail.jpg"
    },
    ...
  ]
}
```

### Получение деталей урока

```javascript
// GET /api/lessons/001

{
  "id": "001",
  "title": "Базовая разминка для спины",
  "description": "...",
  "duration": 15,
  "level": 1,
  "category": "back_health",
  "instructor": "Анна Иванова",
  "videoUrl": "https://cdn.example.com/lessons/001/video.mp4",
  "thumbnailUrl": "https://cdn.example.com/lessons/001/thumbnail.jpg",
  "poses": [...],
  "benefits": [...],
  "equipment": [...]
}
```

### Получение программы

```javascript
// GET /api/programs/prog_001

{
  "id": "prog_001",
  "title": "Здоровая спина за 21 день",
  "description": "...",
  "durationWeeks": 3,
  "lessons": ["001", "002", "003", ...],
  "schedule": [
    {"day": 1, "lessonId": "001", "note": "..."},
    ...
  ]
}
```

---

## Частые вопросы

**Q: Как изменить метаданные урока?**
A: Отредактируйте `content/lessons/XXX_название/metadata.json` и запустите валидацию.

**Q: Как добавить новую категорию?**
A: Обновите enum в `schemas/lesson.schema.json` и создайте файл в `categories/`.

**Q: Видео в другом формате, что делать?**
A: Конвертируйте в MP4:
```bash
ffmpeg -i input.mov -c:v libx264 -c:a aac -b:v 3M output.mp4
```

**Q: Как обновить превью урока?**
A: Удалите `content/lessons/XXX/thumbnail.jpg` и запустите `generate_thumbnails.py`.

---

## Поддержка

**Документация:**
- Полная документация: `../YOGA_PROJECT.md`
- Быстрый старт: `../YOGA_QUICK_START.md`
- Руководство для команды: `../YOGA_TEAM_GUIDE.md`

**Контакты:**
- Product Owner: [email]
- Tech Lead: [email]

---

**Обновлено:** 28 февраля 2026
