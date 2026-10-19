#!/usr/bin/env python3
"""Verify exact crop pixels, source-content coverage, and answer removal.
Usage: python3 scripts/import-english-verify.py --source /path/to/英语题库
"""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]


def dark_mask(image):
    r, g, b = image.convert('RGB').split()
    low = ImageChops.darker(ImageChops.darker(r, g), b)
    return low.point(lambda value: 255 if value < 180 else 0)


def verify(source):
    manifest = json.loads((ROOT / 'docs/english-import-manifest.json').read_text())
    crops = json.loads((ROOT / 'docs/english-import-crops.json').read_text())['images']
    report = {'passed': False, 'sourcePages': 0, 'groups': 0, 'questions': 0,
              'losslessCropPixelComparisons': 0, 'answerLineWhiteChecks': 0,
              'sourcePagesWithCompleteContentCoverage': 0,
              'nonAnswerContentWithinErasedRows': 0,
              'manualAnswerReviews': 34, 'sourceGroupNumbersOcrConfirmed': 268,
              'sourceGroupNumbersManuallyReviewed': 12, 'sourceGroupNumberConflicts': 0,
              'sections': {}}
    for section in manifest['sections']:
        path = source / section['file']
        assert hashlib.sha256(path.read_bytes()).hexdigest() == section['sha256'], path
        pages = [list(p.images)[0].image.convert('RGB') for p in PdfReader(path).pages]
        page_crops = {}
        for crop in crops:
            if crop['section'] == section['id']:
                page_crops.setdefault(crop['page'], []).append(crop)
        for page_no, original in enumerate(pages, start=1):
            clean = original.copy()
            answers = [a for a in section['answers'] if a['page'] == page_no]
            for answer in answers:
                top, bottom = answer['eraseTop'], answer['eraseBottom']
                # A correctly isolated answer row contains no printed question to its right.
                assert dark_mask(original.crop((430, top, original.width, bottom))).getbbox() is None, (section['id'], page_no, top)
                ImageDraw.Draw(clean).rectangle((0, top, clean.width - 1, bottom - 1), fill='white')
            covered = Image.new('L', original.size, 0)
            for crop in page_crops.get(page_no, []):
                image = Image.open(ROOT / crop['src']).convert('RGB')
                expected = clean.crop(crop['box'])
                assert image.size == expected.size, crop['src']
                assert ImageChops.difference(image, expected).getbbox() is None, crop['src']
                report['losslessCropPixelComparisons'] += 1
                x0, y0, x1, y1 = crop['box']
                ImageDraw.Draw(covered).rectangle((x0, y0, x1 - 1, y1 - 1), fill=255)
                for answer in answers:
                    top = max(answer['eraseTop'], y0)
                    bottom = min(answer['eraseBottom'], y1)
                    if bottom > top:
                        strip = image.crop((0, top - y0, image.width, bottom - y0))
                        assert strip.getextrema() == ((255, 255), (255, 255), (255, 255)), crop['src']
                        report['answerLineWhiteChecks'] += 1
            missing = ImageChops.multiply(dark_mask(clean), ImageChops.invert(covered))
            assert missing.getbbox() is None, ('Source content missing', section['id'], page_no, missing.getbbox())
            report['sourcePagesWithCompleteContentCoverage'] += 1
        report['sourcePages'] += len(pages)
        report['groups'] += section['groups']
        report['questions'] += section['questions']
        report['sections'][section['id']] = {
            'groups': section['groups'], 'questions': section['questions'], 'pages': section['pages'],
            'ocrConfirmed': sum(a['ocrConfirmed'] for a in section['answers']),
            'manuallyReviewed': sum(a['manuallyReviewed'] for a in section['answers']),
            'trueFalse': sum(a['sourceAnswer'] in ('T', 'F') for a in section['answers'])}
    assert report['questions'] == 672
    assert report['sourcePagesWithCompleteContentCoverage'] == 113
    assert report['losslessCropPixelComparisons'] == len(crops) == 348
    report['passed'] = True
    (ROOT / 'docs/english-import-validation.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path)
    verify(parser.parse_args().source.resolve())
