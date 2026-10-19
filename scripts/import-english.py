#!/usr/bin/env python3
"""Rebuild the English bank from the seven original scanned PDFs.

Usage: python3 scripts/import-english.py --source /path/to/英语题库
Requires Pillow and pypdf. The checked extraction manifest pins every PDF hash,
answer position and source answer. No OCR output is used as question prose.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'docs/english-import-manifest.json'


def dark_content_bounds(image):
    # The watermark is light gray. Detect actual printed content or colored figures.
    rgb = image.convert('RGB')
    channels = rgb.split()
    from PIL import ImageChops
    minimum = ImageChops.darker(ImageChops.darker(channels[0], channels[1]), channels[2])
    return minimum.point(lambda p: 255 if p < 180 else 0).getbbox()


def instructions(section_id, group_number, grouped):
    if section_id == 'reading' and 17 <= group_number <= 32:
        return '阅读材料，并按图中陈述从上到下的顺序作答。A 表示正确，B 表示错误。'
    if section_id == 'cloze':
        return '阅读短文，按空格 1–10 的顺序作答；图片中的各组选项也按此顺序排列。'
    if section_id == 'writing':
        return '根据给出的材料，从 A–E 中选择信息完成短文，按空格 1–5 的顺序作答。'
    if grouped:
        return '阅读同一组材料，按图片中小题或空格从上到下的顺序作答；选项内容见原题图片。'
    if section_id == 'pronunciation':
        return '从 A、B、C、D 中选出划线部分发音不同的一项。原题图片保留了划线位置。'
    return '请阅读原题图片，选择对应的选项。'


def build(source, output):
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    bank = {'version': 1, 'title': '英语题库', 'source': '用户提供的英语题库扫描资料',
            'totalQuestions': 0, 'sections': []}
    crop_log = []
    for section in manifest['sections']:
        path = source / section['file']
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if digest != section['sha256']:
            raise ValueError(f'源文件与已核对版本不一致：{path.name}')
        pdf = PdfReader(path)
        if len(pdf.pages) != section['pages']:
            raise ValueError(f'页数不一致：{path.name}')
        page_images = []
        for page in pdf.pages:
            images = list(page.images)
            if len(images) != 1:
                raise ValueError('预期每页恰好一张扫描图')
            image = images[0].image.convert('RGB')
            if image.size != (1632, 2112):
                raise ValueError(f'扫描图尺寸变化：{image.size}')
            page_images.append(image)
        # Remove the ENTIRE answer line, including its Chinese label and blue answer.
        for answer in section['answers']:
            draw = ImageDraw.Draw(page_images[answer['page'] - 1])
            draw.rectangle((0, answer['eraseTop'], 1631, answer['eraseBottom'] - 1), fill='white')
        sid, group_size = section['id'], section['groupSize']
        section_out = {'id': sid, 'title': section['title'], 'groups': []}
        asset_dir = output / 'assets/english' / sid
        asset_dir.mkdir(parents=True, exist_ok=True)
        answer_rows = section['answers']
        assert len(answer_rows) == section['questions']
        assert len(answer_rows) % group_size == 0
        previous_end = (1, 0)
        for offset in range(0, len(answer_rows), group_size):
            number = offset // group_size + 1
            gid = f'english-{sid}-{number:03d}'
            group_answers = answer_rows[offset:offset + group_size]
            last_answer = group_answers[-1]
            end = (last_answer['page'], last_answer['eraseTop'])
            assets = []
            for page_no in range(previous_end[0], end[0] + 1):
                top = previous_end[1] if page_no == previous_end[0] else 0
                bottom = end[1] if page_no == end[0] else 2112
                if bottom <= top:
                    continue
                # Fixed horizontal bounds retain diagrams and tables above question numbers.
                cropped = page_images[page_no - 1].crop((225, top, 1435, bottom))
                bounds = dark_content_bounds(cropped)
                if bounds is None:
                    continue
                trim_top, trim_bottom = max(0, bounds[1] - 12), min(cropped.height, bounds[3] + 12)
                cropped = cropped.crop((0, trim_top, cropped.width, trim_bottom))
                relative = f'assets/english/{sid}/{number:03d}-{len(assets)+1}.webp'
                cropped.save(output / relative, format='WEBP', lossless=True, method=4)
                assets.append({'src': relative,
                               'alt': f'{section["title"]}原题第{number}{"组" if group_size > 1 else "题"}，第{len(assets)+1}部分（不含答案）'})
                crop_log.append({'src': relative, 'section': sid, 'sourceGroup': number,
                                 'page': page_no, 'box': [225, top + trim_top, 1435, top + trim_bottom],
                                 'width': cropped.width, 'height': cropped.height})
            if not assets:
                raise ValueError(f'题目没有正文图片：{gid}')
            grouped = group_size > 1
            is_tf = sid == 'reading' and 17 <= number <= 32
            if is_tf:
                options = [{'key': 'A', 'text': '正确'}, {'key': 'B', 'text': '错误'}]
            else:
                keys = 'ABCDE' if sid in ('dialogue', 'writing') or (sid == 'reading' and number <= 16) else (
                    'ABCD' if sid in ('pronunciation', 'vocabulary') else 'ABC')
                options = [{'key': key, 'text': key} for key in keys]
            group = {'id': gid, 'title': f'{section["title"]} · 原题第 {number} {"组" if grouped else "题"}',
                     'sourceNumber': number, 'instructions': instructions(sid, number, grouped),
                     'images': assets, 'questions': []}
            for part, answer in enumerate(group_answers, start=1):
                original = answer['sourceAnswer']
                value = {'T': 'A', 'F': 'B'}.get(original, original)
                if is_tf != (original in ('T', 'F')):
                    raise ValueError(f'判断题范围不一致：{gid}-{part}')
                if value not in [option['key'] for option in options]:
                    raise ValueError(f'答案不在选项内：{gid}-{part}')
                group['questions'].append({
                    'id': f'{gid}-{part}', 'number': f'{number}-{part}' if grouped else str(number),
                    'prompt': f'第 {part} 小题' if grouped else '请选择正确答案',
                    'options': options, 'answer': value,
                    'source': {'file': section['file'], 'group': number, 'part': part,
                               'answerPage': answer['page']},
                })
            section_out['groups'].append(group)
            previous_end = (last_answer['page'], last_answer['eraseBottom'])
        bank['sections'].append(section_out)
        bank['totalQuestions'] += len(answer_rows)
        print(f'{section["title"]}: {len(section_out["groups"])} 组 / {len(answer_rows)} 小题')
    (output / 'data').mkdir(exist_ok=True)
    payload = json.dumps(bank, ensure_ascii=False, separators=(',', ':'))
    (output / 'data/english-bank.js').write_text(
        '// Generated by scripts/import-english.py; see docs/english-import.md.\n'
        'window.ENGLISH_BANK = ' + payload + ';\n', encoding='utf-8')
    (output / 'docs').mkdir(exist_ok=True)
    (output / 'docs/english-import-crops.json').write_text(
        json.dumps({'version': 1, 'images': crop_log}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'合计 {bank["totalQuestions"]} 小题 / {len(crop_log)} 张无答案原题图')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path)
    parser.add_argument('--output', default=ROOT, type=Path)
    args = parser.parse_args()
    build(args.source.resolve(), args.output.resolve())
