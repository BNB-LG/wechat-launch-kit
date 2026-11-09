#!/usr/bin/env python3
"""Read-only operations media checks. No upload, conversion or authenticity claim."""
import argparse
import json
import math
import pathlib
import shutil
import subprocess
import sys
import warnings


def check(manifest_path, ffprobe='ffprobe'):
    manifest_path = pathlib.Path(manifest_path).resolve()
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    base = manifest_path.parent
    operations = manifest.get('operations', {})
    materials = operations.get('materials', [])
    if not isinstance(materials, list):
        raise ValueError('operations.materials 必须为数组')
    result = {'errors': [], 'warnings': [], 'files': [], 'limits': [
        '只读解码实际文件，检查已配置尺寸、大小、格式及视频时长；不证明来源、版权、画面内容或平台接受。',
        '未配置规则、未安装依赖和缺少文件均不等于通过；本工具不修改或重压素材。']}
    def issue(level, path, message):
        result[level].append({'path': path, 'message': message})
    if not materials:
        issue('warnings', 'operations.materials', '未选择任何运营素材；未执行媒体验证')
    for index, item in enumerate(materials):
        tag = f'operations.materials[{index}]'
        record = {'path': item.get('path', '')} if isinstance(item, dict) else {}
        result['files'].append(record)
        try:
            if not isinstance(item, dict):
                raise ValueError('素材须为对象')
            raw = item.get('path', '')
            if not isinstance(raw, str) or not raw or pathlib.PurePath(raw).is_absolute() or '\\' in raw or ':' in raw or '..' in pathlib.PurePosixPath(raw).parts:
                raise ValueError('素材须为清单目录内的相对路径')
            file = (base / raw).resolve()
            if not file.is_relative_to(base):
                raise ValueError('拒绝越界路径或符号链接')
            if not file.is_file():
                raise ValueError('素材文件不存在或不是普通文件')
            if item.get('version') != manifest.get('project', {}).get('version'):
                raise ValueError('素材版本与清单不同')
            rules = item.get('constraints', {})
            if not isinstance(rules, dict):
                raise ValueError('constraints 须为对象')
            allowed = {'width', 'height', 'minBytes', 'maxBytes', 'minDurationSeconds', 'maxDurationSeconds', 'formats', 'checkedAt', 'provenance'}
            if set(rules) - allowed:
                raise ValueError('未知素材限制字段：' + ', '.join(sorted(set(rules) - allowed)))
            for key in ['width', 'height', 'minBytes', 'maxBytes']:
                if key in rules and (type(rules[key]) is not int or rules[key] <= 0):
                    raise ValueError(key + ' 须为正整数')
            for key in ['minDurationSeconds', 'maxDurationSeconds']:
                if key in rules and (type(rules[key]) not in [int, float] or not math.isfinite(rules[key]) or rules[key] < 0):
                    raise ValueError(key + ' 须为非负秒数')
            for low, high in [('minBytes', 'maxBytes'), ('minDurationSeconds', 'maxDurationSeconds')]:
                if low in rules and high in rules and rules[low] > rules[high]:
                    raise ValueError('最小值不能超过最大值')
            formats = rules.get('formats', [])
            if not isinstance(formats, list) or any(x not in ['JPEG', 'PNG', 'WEBP', 'MP4', 'MOV', 'WEBM'] for x in formats):
                raise ValueError('formats 格式配置无效')
            record.update(id=item.get('id', ''), kind=item.get('kind', ''), bytes=file.stat().st_size)
            if item.get('kind') == 'image':
                if any(k in rules for k in ['minDurationSeconds', 'maxDurationSeconds']):
                    raise ValueError('图片不能设置视频时长')
                try:
                    from PIL import Image, ImageOps
                except ImportError:
                    raise ValueError('未检查图片：缺少 Pillow；用 --python 选择已安装 requirements.txt 的环境')
                Image.MAX_IMAGE_PIXELS = 40_000_000
                warnings.simplefilter('error', Image.DecompressionBombWarning)
                suffixes = {'.jpg': 'JPEG', '.jpeg': 'JPEG', '.png': 'PNG', '.webp': 'WEBP'}
                with Image.open(file) as im:
                    if suffixes.get(file.suffix.lower()) != im.format:
                        raise ValueError('扩展名与实际图像格式不一致，或不支持此图像格式')
                    if getattr(im, 'n_frames', 1) != 1:
                        raise ValueError('运营图片不接受动画帧；按当前页面另行核对')
                    im.load()
                    upright = ImageOps.exif_transpose(im)
                    record.update(width=upright.width, height=upright.height, format=im.format)
            elif item.get('kind') == 'video':
                suffixes = {'.mp4': 'MP4', '.mov': 'MOV', '.webm': 'WEBM'}
                container = suffixes.get(file.suffix.lower())
                if container is None:
                    raise ValueError('视频扩展名须为 MP4/MOV/WEBM；以当前页面要求为准')
                binary = shutil.which(ffprobe)
                if binary is None:
                    raise ValueError('未检查视频：缺少 ffprobe；用 --ffprobe 指定本地二进制文件')
                probed = subprocess.run([binary, '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(file)], capture_output=True, text=True, timeout=20, check=False)
                if probed.returncode != 0:
                    raise ValueError('ffprobe 无法解码此视频容器')
                data = json.loads(probed.stdout)
                streams = [s for s in data.get('streams', []) if s.get('codec_type') == 'video' and not s.get('disposition', {}).get('attached_pic')]
                if not streams:
                    raise ValueError('文件没有真实视频流')
                stream = streams[0]
                expected = 'webm' if container == 'WEBM' else 'mov'
                if expected not in data.get('format', {}).get('format_name', '').split(','):
                    raise ValueError('扩展名与 ffprobe 检测的容器不一致')
                if container in ['MP4', 'MOV']:
                    brand = data.get('format', {}).get('tags', {}).get('major_brand', '').strip()
                    if not brand or (container == 'MOV') != (brand == 'qt'):
                        raise ValueError('扩展名与实际 MP4/MOV 容器品牌不同或无法确认')
                    record['majorBrand'] = brand
                elif container == 'WEBM':
                    with file.open('rb') as header:
                        if b'\x42\x82\x84webm' not in header.read(4096):
                            raise ValueError('无法确认 WebM DocType，不能把 Matroska 改后缀当 WebM')
                width, height = int(stream['width']), int(stream['height'])
                rotation = next((s.get('rotation', 0) for s in stream.get('side_data_list', []) if 'rotation' in s), stream.get('tags', {}).get('rotate', 0))
                if abs(float(rotation)) % 180 == 90:
                    width, height = height, width
                duration = float(data.get('format', {}).get('duration', stream.get('duration', 'nan')))
                if not math.isfinite(duration) or duration <= 0:
                    raise ValueError('无法读取有效视频时长')
                record.update(width=width, height=height, format=container, durationSeconds=duration, codec=stream.get('codec_name', 'unknown'))
            else:
                raise ValueError('kind 须为 image / video')
            if formats and record['format'] not in formats:
                issue('errors', tag + '.format', '实际格式 ' + record['format'] + ' 不符合 ' + '/'.join(formats))
            for key in ['width', 'height']:
                if key in rules and record[key] != rules[key]:
                    issue('errors', tag + '.' + key, f'实际 {record[key]}，配置要求 {rules[key]}')
            for low, high, key in [('minBytes', 'maxBytes', 'bytes'), ('minDurationSeconds', 'maxDurationSeconds', 'durationSeconds')]:
                if low in rules and record.get(key, -1) < rules[low]:
                    issue('errors', tag + '.' + key, f'实际 {record.get(key)}，低于 {rules[low]}')
                if high in rules and record.get(key, math.inf) > rules[high]:
                    issue('errors', tag + '.' + key, f'实际 {record.get(key)}，超过 {rules[high]}')
            missing = [key for key in ['width', 'height', 'maxBytes', 'formats'] if not rules.get(key)]
            if item['kind'] == 'video' and 'maxDurationSeconds' not in rules:
                missing.append('maxDurationSeconds')
            if missing:
                issue('warnings', tag + '.constraints', '未检查未配置规则：' + ', '.join(missing))
            if not rules.get('checkedAt') or not rules.get('provenance'):
                issue('warnings', tag + '.constraints', '规格出处与当前账号核对日期不完整')
            if item.get('contentReview') != 'reviewed' or not item.get('contentNotes'):
                issue('warnings', tag + '.contentReview', '画面内容与授权仍需人工核对；通用封面按所见页面建议不放图标和游戏名')
        except Exception as error:
            # Do not leak ffprobe output, absolute paths or source content in reports.
            message = str(error) if isinstance(error, ValueError) else ('检查未完成：' + type(error).__name__)
            issue('errors', tag, message)
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifest')
    parser.add_argument('--ffprobe', default='ffprobe')
    parser.add_argument('--json', action='store_true')
    options = parser.parse_args()
    try:
        report = check(options.manifest, options.ffprobe)
        if options.json:
            print(json.dumps(report, ensure_ascii=False, indent=2))
        else:
            for level in ['errors', 'warnings']:
                for item in report[level]:
                    print(f'{level.upper()} {item["path"]}: {item["message"]}')
            print(f'读取 {len(report["files"])} 项运营素材：{len(report["errors"])} 错误，{len(report["warnings"])} 待核对；未验证平台接受。')
        sys.exit(1 if report['errors'] else 0)
    except Exception as error:
        print('ERROR: ' + str(error), file=sys.stderr)
        sys.exit(2)
