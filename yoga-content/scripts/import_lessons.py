#!/usr/bin/env python3
"""
Скрипт для импорта и структурирования уроков йоги
Использование: python import_lessons.py --source /path/to/videos --output ./content/lessons
"""

import os
import json
import shutil
import argparse
from pathlib import Path
from typing import Dict, List
import jsonschema


class LessonImporter:
    """Импортер уроков йоги"""
    
    def __init__(self, source_dir: str, output_dir: str, schema_path: str):
        self.source_dir = Path(source_dir)
        self.output_dir = Path(output_dir)
        self.schema_path = Path(schema_path)
        self.schema = self._load_schema()
        
    def _load_schema(self) -> Dict:
        """Загрузка JSON схемы для валидации"""
        with open(self.schema_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def validate_lesson(self, lesson_data: Dict) -> bool:
        """Валидация данных урока по схеме"""
        try:
            jsonschema.validate(instance=lesson_data, schema=self.schema)
            return True
        except jsonschema.exceptions.ValidationError as e:
            print(f"❌ Ошибка валидации: {e.message}")
            return False
    
    def create_lesson_folder(self, lesson_id: str, lesson_title: str) -> Path:
        """Создание папки для урока"""
        # Транслитерация названия для папки
        folder_name = f"{lesson_id}_{self._transliterate(lesson_title)}"
        lesson_path = self.output_dir / folder_name
        lesson_path.mkdir(parents=True, exist_ok=True)
        return lesson_path
    
    def _transliterate(self, text: str) -> str:
        """Простая транслитерация русского текста"""
        translit_map = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
            'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
            'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
            'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
            'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
            ' ': '_', '-': '_'
        }
        result = []
        for char in text.lower():
            result.append(translit_map.get(char, char))
        return ''.join(result)[:50]  # Ограничение длины
    
    def copy_video(self, source_video: Path, lesson_path: Path) -> str:
        """Копирование видео файла"""
        video_dest = lesson_path / "video.mp4"
        if source_video.exists():
            shutil.copy2(source_video, video_dest)
            print(f"  ✓ Видео скопировано: {video_dest}")
            return str(video_dest.relative_to(self.output_dir.parent))
        else:
            print(f"  ⚠ Видео не найдено: {source_video}")
            return ""
    
    def create_metadata(self, lesson_data: Dict, lesson_path: Path):
        """Создание файла метаданных"""
        metadata_path = lesson_path / "metadata.json"
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(lesson_data, f, ensure_ascii=False, indent=2)
        print(f"  ✓ Метаданные созданы: {metadata_path}")
    
    def create_description(self, lesson_data: Dict, lesson_path: Path):
        """Создание файла описания в Markdown"""
        description_path = lesson_path / "description.md"
        
        content = f"""# {lesson_data['title']}

## Описание
{lesson_data['description']}

## Информация об уроке
- **Категория:** {lesson_data['category']}
- **Уровень:** {lesson_data['level']}
- **Длительность:** {lesson_data['duration']} минут
- **Инструктор:** {lesson_data['instructor']}

## Польза
"""
        for benefit in lesson_data.get('benefits', []):
            content += f"- {benefit}\n"
        
        if lesson_data.get('poses'):
            content += "\n## Асаны в уроке\n"
            for pose in lesson_data['poses']:
                content += f"- **{pose['name']}** ({pose['duration']} сек)"
                if 'sanskrit_name' in pose:
                    content += f" - *{pose['sanskrit_name']}*"
                content += "\n"
        
        if lesson_data.get('contraindications'):
            content += "\n## Противопоказания\n"
            for contra in lesson_data['contraindications']:
                content += f"- {contra}\n"
        
        if lesson_data.get('equipment'):
            content += "\n## Необходимое оборудование\n"
            for equip in lesson_data['equipment']:
                content += f"- {equip}\n"
        
        with open(description_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✓ Описание создано: {description_path}")
    
    def import_lesson(self, lesson_data: Dict, video_path: Path = None):
        """Импорт одного урока"""
        lesson_id = lesson_data['id']
        lesson_title = lesson_data['title']
        
        print(f"\n📦 Импорт урока {lesson_id}: {lesson_title}")
        
        # Валидация
        if not self.validate_lesson(lesson_data):
            print(f"  ❌ Урок {lesson_id} не прошёл валидацию")
            return False
        
        # Создание папки
        lesson_path = self.create_lesson_folder(lesson_id, lesson_title)
        
        # Копирование видео
        if video_path and video_path.exists():
            video_url = self.copy_video(video_path, lesson_path)
            lesson_data['video_url'] = video_url
        
        # Обновление путей
        lesson_data['thumbnail_url'] = str((lesson_path / "thumbnail.jpg").relative_to(self.output_dir.parent))
        
        # Создание метаданных и описания
        self.create_metadata(lesson_data, lesson_path)
        self.create_description(lesson_data, lesson_path)
        
        print(f"  ✅ Урок {lesson_id} успешно импортирован")
        return True
    
    def batch_import(self, lessons_config: List[Dict]):
        """Массовый импорт уроков"""
        print(f"\n🚀 Начинаем импорт {len(lessons_config)} уроков\n")
        print("=" * 60)
        
        success_count = 0
        failed_count = 0
        
        for lesson in lessons_config:
            try:
                video_path = None
                if 'source_video' in lesson:
                    video_path = self.source_dir / lesson['source_video']
                
                if self.import_lesson(lesson, video_path):
                    success_count += 1
                else:
                    failed_count += 1
            except Exception as e:
                print(f"  ❌ Ошибка при импорте урока {lesson.get('id', '?')}: {e}")
                failed_count += 1
        
        print("\n" + "=" * 60)
        print(f"\n✅ Успешно импортировано: {success_count}")
        print(f"❌ Ошибок: {failed_count}")
        print(f"📊 Всего обработано: {success_count + failed_count}")
    
    def generate_index(self):
        """Генерация индексного файла со всеми уроками"""
        lessons = []
        
        for lesson_dir in sorted(self.output_dir.iterdir()):
            if lesson_dir.is_dir():
                metadata_path = lesson_dir / "metadata.json"
                if metadata_path.exists():
                    with open(metadata_path, 'r', encoding='utf-8') as f:
                        lessons.append(json.load(f))
        
        index_path = self.output_dir / "lessons_index.json"
        with open(index_path, 'w', encoding='utf-8') as f:
            json.dump({
                "total_lessons": len(lessons),
                "lessons": lessons
            }, f, ensure_ascii=False, indent=2)
        
        print(f"\n📋 Индексный файл создан: {index_path}")
        print(f"   Всего уроков в индексе: {len(lessons)}")


def main():
    parser = argparse.ArgumentParser(description='Импорт уроков йоги')
    parser.add_argument('--source', required=True, help='Папка с исходными видео')
    parser.add_argument('--output', default='./content/lessons', help='Папка для импорта')
    parser.add_argument('--schema', default='./schemas/lesson.schema.json', help='Путь к JSON схеме')
    parser.add_argument('--config', help='JSON файл с конфигурацией уроков')
    
    args = parser.parse_args()
    
    # Создание импортера
    importer = LessonImporter(
        source_dir=args.source,
        output_dir=args.output,
        schema_path=args.schema
    )
    
    # Если указан конфиг - массовый импорт
    if args.config:
        with open(args.config, 'r', encoding='utf-8') as f:
            lessons_config = json.load(f)
        importer.batch_import(lessons_config)
    
    # Генерация индекса
    importer.generate_index()


if __name__ == '__main__':
    main()
