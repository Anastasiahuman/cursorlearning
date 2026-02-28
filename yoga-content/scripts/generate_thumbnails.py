#!/usr/bin/env python3
"""
Скрипт для генерации превью (thumbnails) из видео уроков
Использование: python generate_thumbnails.py --input ./content/lessons
"""

import os
import subprocess
from pathlib import Path
import argparse
import json


class ThumbnailGenerator:
    """Генератор превью из видео"""
    
    def __init__(self, lessons_dir: str):
        self.lessons_dir = Path(lessons_dir)
        self.success_count = 0
        self.failed_count = 0
        
    def check_ffmpeg(self) -> bool:
        """Проверка наличия ffmpeg"""
        try:
            subprocess.run(['ffmpeg', '-version'], 
                         capture_output=True, 
                         check=True)
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            print("❌ ffmpeg не установлен!")
            print("\nУстановите ffmpeg:")
            print("  macOS: brew install ffmpeg")
            print("  Ubuntu/Debian: sudo apt install ffmpeg")
            print("  Windows: скачайте с https://ffmpeg.org/download.html")
            return False
    
    def generate_thumbnail(self, video_path: Path, output_path: Path, 
                          timestamp: str = "00:00:05") -> bool:
        """
        Генерация превью из видео
        
        Args:
            video_path: Путь к видео файлу
            output_path: Путь для сохранения превью
            timestamp: Временная метка для кадра (по умолчанию 5 секунда)
        """
        try:
            # Команда ffmpeg для извлечения кадра
            cmd = [
                'ffmpeg',
                '-i', str(video_path),
                '-ss', timestamp,  # Временная метка
                '-vframes', '1',   # Один кадр
                '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',  # Масштабирование
                '-q:v', '2',       # Качество (2 = высокое)
                '-y',              # Перезаписать если существует
                str(output_path)
            ]
            
            # Запуск ffmpeg
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True
            )
            
            return True
            
        except subprocess.CalledProcessError as e:
            print(f"  ❌ Ошибка ffmpeg: {e.stderr}")
            return False
        except Exception as e:
            print(f"  ❌ Ошибка: {e}")
            return False
    
    def process_lesson(self, lesson_path: Path):
        """Обработка одного урока"""
        lesson_id = lesson_path.name.split('_')[0]
        
        # Проверка наличия видео
        video_path = lesson_path / "video.mp4"
        if not video_path.exists():
            print(f"⚠️  Урок {lesson_id}: Видео не найдено, пропускаем")
            self.failed_count += 1
            return
        
        # Путь для превью
        thumbnail_path = lesson_path / "thumbnail.jpg"
        
        # Если превью уже существует
        if thumbnail_path.exists():
            print(f"⏭  Урок {lesson_id}: Превью уже существует, пропускаем")
            return
        
        print(f"🎬 Урок {lesson_id}: Генерация превью...")
        
        # Получение длительности видео для выбора оптимального кадра
        metadata_path = lesson_path / "metadata.json"
        timestamp = "00:00:05"  # По умолчанию 5 секунда
        
        if metadata_path.exists():
            with open(metadata_path, 'r', encoding='utf-8') as f:
                metadata = json.load(f)
                duration = metadata.get('duration', 0)
                # Берём кадр из середины первой минуты или 1/4 длительности
                if duration > 2:
                    optimal_second = min(duration * 60 // 4, 30)
                    timestamp = f"00:00:{optimal_second:02d}"
        
        # Генерация превью
        if self.generate_thumbnail(video_path, thumbnail_path, timestamp):
            print(f"  ✅ Превью создано: {thumbnail_path}")
            self.success_count += 1
        else:
            print(f"  ❌ Не удалось создать превью")
            self.failed_count += 1
    
    def process_all_lessons(self):
        """Обработка всех уроков"""
        print("\n" + "=" * 60)
        print("🚀 ГЕНЕРАЦИЯ ПРЕВЬЮ ДЛЯ УРОКОВ")
        print("=" * 60 + "\n")
        
        # Проверка ffmpeg
        if not self.check_ffmpeg():
            return
        
        # Получение списка уроков
        lesson_dirs = sorted([d for d in self.lessons_dir.iterdir() 
                            if d.is_dir() and not d.name.startswith('.')])
        
        if not lesson_dirs:
            print("❌ Уроки не найдены в папке:", self.lessons_dir)
            return
        
        print(f"Найдено уроков: {len(lesson_dirs)}\n")
        
        # Обработка каждого урока
        for lesson_dir in lesson_dirs:
            self.process_lesson(lesson_dir)
        
        # Итоговая статистика
        print("\n" + "=" * 60)
        print("📊 ИТОГИ")
        print("=" * 60)
        print(f"\n✅ Успешно создано: {self.success_count}")
        print(f"❌ Ошибок: {self.failed_count}")
        print(f"📊 Всего обработано: {self.success_count + self.failed_count}")
    
    def generate_program_thumbnails(self, programs_dir: Path, 
                                   template_image: Path = None):
        """
        Генерация превью для программ
        
        Args:
            programs_dir: Папка с программами
            template_image: Шаблон изображения (опционально)
        """
        print("\n" + "=" * 60)
        print("📋 ГЕНЕРАЦИЯ ПРЕВЬЮ ДЛЯ ПРОГРАММ")
        print("=" * 60 + "\n")
        
        if not programs_dir.exists():
            print("⚠️  Папка программ не найдена")
            return
        
        program_files = list(programs_dir.glob("*.json"))
        
        for program_file in program_files:
            with open(program_file, 'r', encoding='utf-8') as f:
                program_data = json.load(f)
            
            program_id = program_data['id']
            program_name = program_file.stem
            
            # Создание папки для программы
            program_folder = programs_dir / program_name
            program_folder.mkdir(exist_ok=True)
            
            thumbnail_path = program_folder / "thumbnail.jpg"
            
            if thumbnail_path.exists():
                print(f"⏭  Программа {program_id}: Превью уже существует")
            else:
                print(f"⚠️  Программа {program_id}: Создайте превью вручную")
                print(f"     Путь: {thumbnail_path}")
                print(f"     Размер: 1200x630 px")
                print(f"     Формат: JPG\n")


def main():
    parser = argparse.ArgumentParser(
        description='Генерация превью для уроков йоги'
    )
    parser.add_argument(
        '--input', 
        required=True, 
        help='Папка с уроками (content/lessons)'
    )
    parser.add_argument(
        '--programs',
        help='Папка с программами (опционально)'
    )
    parser.add_argument(
        '--timestamp',
        default='00:00:05',
        help='Временная метка для кадра (по умолчанию 00:00:05)'
    )
    
    args = parser.parse_args()
    
    # Генерация превью для уроков
    generator = ThumbnailGenerator(lessons_dir=args.input)
    generator.process_all_lessons()
    
    # Генерация превью для программ (если указано)
    if args.programs:
        generator.generate_program_thumbnails(Path(args.programs))


if __name__ == '__main__':
    main()
