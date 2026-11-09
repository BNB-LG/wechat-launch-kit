#!/usr/bin/env python3
"""Read-only PNG/JPEG checks. Never modifies images or claims authenticity."""
import argparse, hashlib, json, pathlib, sys, warnings

def check(manifest_path):
    try:
        from PIL import Image, ImageOps
    except ImportError:
        raise RuntimeError('缺少 Pillow。创建虚拟环境后运行 python -m pip install -r requirements.txt；CLI 用 --python 指向该环境。')
    manifest_path = pathlib.Path(manifest_path).resolve()
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    base = manifest_path.parent
    req = manifest.get('requirements', {})
    errors, notices, items = [], [], []
    result = {'errors': errors, 'warnings': notices, 'files': items, 'limits': ['只检查字节、解码尺寸和完全相同像素；不证明真实运行、画面内容或平台接受。', '不同 JPEG 压缩、裁切或细微修改可能逃过像素完全重复检查；必须人工对照。']}
    for key in ['minBytes','maxBytes','sceneMin','gameplayMin','systemMin','perSystemMin']:
        if type(req.get(key)) is not int or req[key] < 0:
            raise ValueError('无效 requirements.' + key)
    if req['minBytes'] > req['maxBytes'] or req.get('duplicatePolicy') not in ['error','warn']:
        raise ValueError('无效截图检查配置')
    shots = manifest.get('screenshots', [])
    if not isinstance(shots, list): raise ValueError('screenshots 必须为数组')
    systems = manifest.get('content', {}).get('systems', [])
    ids = [x['id'] for x in systems]
    counts = {'scene':0, 'gameplay':0}
    system_counts = {s:0 for s in ids}
    file_hashes, pixel_hashes = {}, {}
    Image.MAX_IMAGE_PIXELS = 40_000_000
    warnings.simplefilter('error', Image.DecompressionBombWarning)
    def local_path(raw):
        if not isinstance(raw,str) or not raw or pathlib.PurePath(raw).is_absolute() or '\\' in raw or ':' in raw or '..' in pathlib.PurePosixPath(raw).parts:
            raise ValueError('图片须为清单目录内的相对路径')
        file = (base / raw).resolve()
        if not file.is_relative_to(base): raise ValueError('拒绝越界路径或符号链接')
        return file

    icon = manifest.get('project',{}).get('iconPath','')
    if icon:
        result['icon'] = {'path':icon}
        try:
            file = local_path(icon)
            limits = {'iconWidth':144,'iconHeight':144,'iconMaxBytes':2097152,**req.get('fieldLimits',{})}
            for key in ['iconWidth','iconHeight','iconMaxBytes']:
                if type(limits[key]) is not int or limits[key] <= 0: raise ValueError('无效 requirements.fieldLimits.'+key)
            if file.suffix.lower() not in ['.png','.jpg','.jpeg']: raise ValueError('头像只接受 PNG/JPG/JPEG；以当前表单为准')
            with Image.open(file) as im:
                if im.format not in ['PNG','JPEG'] or getattr(im,'n_frames',1) != 1: raise ValueError('头像须为单帧 PNG/JPEG')
                if (im.format=='PNG') != (file.suffix.lower()=='.png'): raise ValueError('头像扩展名与实际格式不同')
                im.load()
                upright = ImageOps.exif_transpose(im)
                result['icon'].update(width=upright.width,height=upright.height,bytes=file.stat().st_size,format=im.format)
                if (upright.width,upright.height) != (limits['iconWidth'],limits['iconHeight']):
                    notices.append({'path':'project.iconPath','message':f'当前模板推荐 {limits["iconWidth"]}×{limits["iconHeight"]}；现有 {upright.width}×{upright.height}，请核对当前账号页面'})
                if file.stat().st_size > limits['iconMaxBytes']:
                    notices.append({'path':'project.iconPath','message':f'当前模板推荐不超过 {limits["iconMaxBytes"]} 字节；请核对当前账号页面'})
        except (OSError, ValueError, Image.DecompressionBombError, Image.DecompressionBombWarning) as e:
            errors.append({'path':'project.iconPath','message':e.strerror or type(e).__name__ if isinstance(e,OSError) else str(e)})
    for index, shot in enumerate(shots):
        tag = f'screenshots[{index}]'
        if not isinstance(shot,dict):
            errors.append({'path':tag,'message':'截图项须为对象'});continue
        record = {'index':index, 'path':shot.get('path',''), 'column':shot.get('column',''), 'systemId':shot.get('systemId','')}
        items.append(record)
        try:
            raw = shot.get('path','')
            file = local_path(raw)
            if file.suffix.lower() not in ['.png','.jpg','.jpeg']: raise ValueError('只接受 PNG/JPG/JPEG')
            if shot.get('column') not in ['scene','gameplay','system','other']: raise ValueError('无效栏目')
            if shot.get('column')=='system' and shot.get('systemId') not in ids: raise ValueError('系统关联不存在')
            if shot.get('source') not in ['wechat-device','wechat-devtools']: raise ValueError('来源须为微信真机或微信开发者工具，真实性人工复核')
            if shot.get('version') != manifest['project']['version']: raise ValueError('截图版本与清单版本不同')
            size = file.stat().st_size
            record['bytes'] = size
            if size < req['minBytes'] or size > req['maxBytes']: raise ValueError(f'大小 {size} 字节，不在 {req["minBytes"]}–{req["maxBytes"]} 字节内')
            data = file.read_bytes()
            digest = hashlib.sha256(data).hexdigest()
            with Image.open(file) as im:
                if im.format not in ['PNG','JPEG']: raise ValueError('文件内容不是 PNG/JPEG')
                if (im.format=='PNG') != (file.suffix.lower()=='.png'): raise ValueError('文件扩展名与实际格式不同')
                if getattr(im,'n_frames',1) != 1: raise ValueError('不接受动画图片')
                im.load()
                rgba = ImageOps.exif_transpose(im).convert('RGBA')
                record.update(width=rgba.width,height=rgba.height,format=im.format,fileSha256=digest)
                pixel = hashlib.sha256(f'{rgba.width}x{rgba.height}:RGBA:'.encode()+rgba.tobytes()).hexdigest()
                record['pixelSha256'] = pixel
            duplicate = None
            if digest in file_hashes: duplicate = f'与第 {file_hashes[digest]+1} 张文件完全重复（跨栏目也检查）'
            elif pixel in pixel_hashes: duplicate = f'与第 {pixel_hashes[pixel]+1} 张解码像素完全重复；改名或重编码不产生新画面'
            if duplicate: (errors if req['duplicatePolicy']=='error' else notices).append({'path':tag,'message':duplicate})
            file_hashes.setdefault(digest,index);pixel_hashes.setdefault(pixel,index)
            if shot['column'] in counts: counts[shot['column']] += 1
            if shot['column']=='system': system_counts[shot['systemId']] += 1
        except (OSError, ValueError, KeyError, Image.DecompressionBombError, Image.DecompressionBombWarning) as e:
            errors.append({'path':tag,'message':e.strerror or type(e).__name__ if isinstance(e,OSError) else str(e)})
    if req.get('enabled'):
        for key,minimum in [('scene',req['sceneMin']),('gameplay',req['gameplayMin'])]:
            if counts[key] < minimum: errors.append({'path':key,'message':f'可解码且元数据有效 {counts[key]} 张，当前模板要求至少 {minimum} 张'})
        if len(ids)<req['systemMin']: errors.append({'path':'systems','message':f'实际系统不足 {req["systemMin"]} 项'})
        for sid,n in system_counts.items():
            if n<req['perSystemMin']: errors.append({'path':'system/'+sid,'message':f'可解码且元数据有效 {n} 张，要求至少 {req["perSystemMin"]} 张'})
    if not req.get('checkedAt'): notices.append({'path':'requirements.checkedAt','message':'检查模板未对照当前账号页面；不能据此保证平台接受'})
    result['counts'] = {**counts,'systems':system_counts}
    return result

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifest');parser.add_argument('--json',action='store_true')
    options=parser.parse_args()
    try:
        report=check(options.manifest)
        if options.json: print(json.dumps(report,ensure_ascii=False,indent=2))
        else:
            for level in ['errors','warnings']:
                for item in report[level]: print(f'{level.upper()} {item["path"]}: {item["message"]}')
            print(f'检查 {len(report["files"])} 张：{len(report["errors"])} 错误，{len(report["warnings"])} 提醒。仍需人工核对真实性与栏目。')
        sys.exit(1 if report['errors'] else 0)
    except Exception as error:
        print('ERROR: '+str(error),file=sys.stderr);sys.exit(2)
