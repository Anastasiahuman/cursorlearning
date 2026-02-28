#!/usr/bin/env python3
"""
Скрипт для валидации контента йога-приложения
Проверяет корректность метаданных, наличие файлов, ссылки между уроками и программами
"""

import os
import json
from pathlib import Path
from typing import Dict, List, Set
import jsonschema


class ContentValidator:
    """Валидатор контента приложения"""
    
    def __init__(self, content_dir: str, schemas_dir: str):
        self.content_dir = Path(content_dir)
        self.schemas_dir = Path(schemas_dir)
        self.errors = []
        self.warnings = []
        self.lesson_ids = set()
        
    def load_schema(self, schema_name: str) -> Dict:
        """Загрузка JSON схемы"""
        schema_path = self.schemas_dir / f"{schema_name}.schema.json"
        with open(schema_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def add_error(self, message: str):
        """Добавление ошибки"""
        self.errors.append(f"❌ {message}")
        print(f"❌ {message}")
    
    def add_warning(self, message: str):
        """Добавление предупреждения"""
        self.warnings.append(f"⚠️  {message}")
        print(f"⚠️  {message}")
    
    def validate_json_schema(self, data: Dict, schema: Dict, item_name: str) -> bool:
        """Валидация данных по JSON схеме"""
        try:
            jsonschema.validate(instance=data, schema=schema)
            return True
        except jsonschema.exceptions.ValidationError as e:
            self.add_error(f"{item_name}: Ошибка схемы - {e.message}")
            return False
    
    def validate_lesson(self, lesson_path: Path) -> bool:
        """Валидация одного урока"""
        lesson_id = lesson_path.name.split('_')[0]
        print(f"\n🔍 Проверка урока {lesson_id}: {lesson_path.name}")
        
        is_valid = True
        
        # Проверка metadata.json
        metadata_path = lesson_path / "metadata.json"
        if not metadata_path.exists():
            self.add_error(f"Урок {lesson_id}: Отсутствует metadata.json")
            return False
        
        with open(metadata_path, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        
        # Валидация по схеме
        schema = self.load_schema('lesson')
        if not self.validate_json_schema(metadata, schema, f"Урок {lesson_id}"):
            is_valid = False
        
        # Проверка ID
        if metadata.get('id') != lesson_id:
            self.add_error(f"Урок {lesson_id}: ID в метаданных ({metadata.get('id')}) не совпадает с папкой")
            is_valid = False
        
        self.lesson_ids.add(lesson_id)
        
        # Проверка наличия видео
        video_path = lesson_path / "video.mp4"
        if not video_path.exists():
            self.add_warning(f"Урок {lesson_id}: Отсутствует видео файл")
        else:
            # Проверка размера видео
            video_size_mb = video_path.stat().st_size / (1024 * 1024)
            if video_size_mb < 1:
                self.add_warning(f"Урок {lesson_id}: Видео слишком маленькое ({video_size_mb:.2f} MB)")
        
        # Проверка превью
        thumbnail_path = lesson_path / "thumbnail.jpg"
        if not thumbnail_path.exists():
            self.add_warning(f"Урок {lesson_id}: Отсутствует превью изображение")
        
        # Проверка description.md
        description_path = lesson_path / "description.md"
        if not description_path.exists():
            self.add_warning(f"Урок {lesson_id}: Отсутствует description.md")
        
        # Проверка длительности
        duration = metadata.get('duration', 0)
        if duration < 5 or duration > 90:
            self.add_warning(f"Урок {lesson_id}: Необычная длительность ({duration} мин)")
        
        # Проверка тегов
        tags = metadata.get('tags', [])
        if len(tags) < 2:
            self.add_warning(f"Урок {lesson_id}: Мало тегов ({len(tags)})")
        
        if is_valid:
            print(f"  ✅ Урок {lesson_id} валиден")
        
        return is_valid
    
    def validate_all_lessons(self) -> int:
        """Валидация всех уроков"""
        lessons_dir = self.content_dir / "lessons"
        if not lessons_dir.exists():
            self.add_error("Папка lessons не найдена")
            return 0
        
        print("\n" + "=" * 60)
        print("📚 ВАЛИДАЦИЯ УРОКОВ")
        print("=" * 60)
        
        valid_count = 0
        total_count = 0
        
        for lesson_path in sorted(lessons_dir.iterdir()):
            if lesson_path.is_dir() and not lesson_path.name.startswith('.'):
                total_count += 1
                if self.validate_lesson(lesson_path):
                    valid_count += 1
        
        print(f"\n✅ Валидных уроков: {valid_count}/{total_count}")
        return valid_count
    
    def validate_program(self, program_path: Path) -> bool:
        """Валидация программы"""
        program_id = program_path.stem
        print(f"\n🔍 Проверка программы {program_id}")
        
        is_valid = True
        
        with open(program_path, 'r', encoding='utf-8') as f:
            program_data = json.load(f)
        
        # Валидация по схеме
        schema = self.load_schema('program')
        if not self.validate_json_schema(program_data, schema, f"Программа {program_id}"):
            is_valid = False
        
        # Проверка ссылок на уроки
        lessons = program_data.get('lessons', [])
        for lesson_id in lessons:
            if lesson_id not in self.lesson_ids:
                self.add_error(f"Программа {program_id}: Урок {lesson_id} не найден")
                is_valid = False
        
        # Проверка расписания
        schedule = program_data.get('schedule', [])
        schedule_lessons = set(item['lesson_id'] for item in schedule if 'lesson_id' in item)
        
        # Все уроки из lessons должны быть в расписании
        for lesson_id in lessons:
            if lesson_id not in schedule_lessons:
                self.add_warning(f"Программа {program_id}: Урок {lesson_id} не включён в расписание")
        
        # Проверка длительности
        duration_weeks = program_data.get('duration_weeks', 0)
        total_days = len(schedule)
        expected_days = duration_weeks * 7
        
        if total_days != expected_days:
            self.add_warning(
                f"Программа {program_id}: Несоответствие длительности "
                f"({duration_weeks} недель = {expected_days} дней, в расписании {total_days} дней)"
            )
        
        if is_valid:
            print(f"  ✅ Программа {program_id} валидна")
        
        return is_valid
    
    def validate_all_programs(self) -> int:
        """Валидация всех программ"""
        programs_dir = self.content_dir / "programs"
        if not programs_dir.exists():
            self.add_warning("Папка programs не найдена")
            return 0
        
        print("\n" + "=" * 60)
        print("📋 ВАЛИДАЦИЯ ПРОГРАММ")
        print("=" * 60)
        
        valid_count = 0
        total_count = 0
        
        for program_path in sorted(programs_dir.glob("*.json")):
            total_count += 1
            if self.validate_program(program_path):
                valid_count += 1
        
        print(f"\n✅ Валидных программ: {valid_count}/{total_count}")
        return valid_count
    
    def validate_categories(self):
        """Валидация категорий"""
        categories_dir = self.content_dir / "categories"
        if not categories_dir.exists():
            self.add_warning("Папка categories не найдена")
            return
        
        print("\n" + "=" * 60)
        print("🗂  ВАЛИДАЦИЯ КАТЕГОРИЙ")
        print("=" * 60)
        
        expected_categories = [
            'back_health.json',
            'flexibility.json',
            'hip_joints.json',
            'meditation.json',
            'relaxation.json'
        ]
        
        for category_file in expected_categories:
            category_path = categories_dir / category_file
            if not category_path.exists():
                self.add_warning(f"Категория {category_file} не найдена")
            else:
                print(f"  ✅ Категория {category_file} найдена")
    
    def generate_report(self):
        """Генерация отчёта о валидации"""
        print("\n" + "=" * 60)
        print("📊 ИТОГОВЫЙ ОТЧЁТ")
        print("=" * 60)
        
        print(f"\n📚 Всего уроков: {len(self.lesson_ids)}")
        print(f"❌ Ошибок: {len(self.errors)}")
        print(f"⚠️  Предупреждений: {len(self.warnings)}")
        
        if self.errors:
            print("\n🔴 ОШИБКИ:")
            for error in self.errors:
                print(f"  {error}")
        
        if self.warnings:
            print("\n🟡 ПРЕДУПРЕЖДЕНИЯ:")
            for warning in self.warnings:
                print(f"  {warning}")
        
        if not self.errors and not self.warnings:
            print("\n🎉 ВСЁ ОТЛИЧНО! Контент полностью валиден.")
        elif not self.errors:
            print("\n✅ Критических ошибок нет. Есть предупреждения.")
        else:
            print("\n❌ Обнаружены критические ошибки. Требуется исправление.")
        
        # Сохранение отчёта
        report_path = self.content_dir / "validation_report.json"
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump({
                "total_lessons": len(self.lesson_ids),
                "errors_count": len(self.errors),
                "warnings_count": len(self.warnings),
                "errors": self.errors,
                "warnings": self.warnings
            }, f, ensure_ascii=False, indent=2)
        
        print(f"\n📄 Отчёт сохранён: {report_path}")
    
    def run_full_validation(self):
        """Запуск полной валидации"""
        print("\n" + "=" * 60)
        print("🚀 ЗАПУСК ПОЛНОЙ ВАЛИДАЦИИ КОНТЕНТА")
        print("=" * 60)
        
        # Валидация уроков
        self.validate_all_lessons()
        
        # Валидация программ
        self.validate_all_programs()
        
        # Валидация категорий
        self.validate_categories()
        
        # Генерация отчёта
        self.generate_report()


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Валидация контента йога-приложения')
    parser.add_argument('--content', default='./content', help='Папка с контентом')
    parser.add_argument('--schemas', default='./schemas', help='Папка со схемами')
    
    args = parser.parse_args()
    
    validator = ContentValidator(
        content_dir=args.content,
        schemas_dir=args.schemas
    )
    
    validator.run_full_validation()


if __name__ == '__main__':
    main()
