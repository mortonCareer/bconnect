"""
Instagram ZIP 파일을 파싱하여 게시물 데이터를 추출하는 Lambda 함수

Expected ZIP structure:
- your_instagram_activity/media/posts_1.json
- your_instagram_activity/media/posts_2.json (다수의 게시물인 경우)
- media/posts/... (실제 이미지/동영상 파일)
"""

import json
import base64
import zipfile
import io
import re


def handler(event, context):
    try:
        # Base64로 인코딩된 ZIP 파일 받기
        body = event.get('body', '')
        is_base64 = event.get('isBase64Encoded', False)

        if is_base64:
            zip_data = base64.b64decode(body)
        else:
            zip_data = body.encode() if isinstance(body, str) else body

        posts = parse_instagram_zip(zip_data)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'count': len(posts),
                'posts': posts
            }, ensure_ascii=False)
        }

    except Exception as e:
        print(f'Error processing ZIP: {e}')
        return {
            'statusCode': 400,
            'body': json.dumps({
                'success': False,
                'error': str(e) or 'ZIP 파일 처리 중 오류가 발생했습니다'
            }, ensure_ascii=False)
        }


def parse_instagram_zip(zip_data: bytes) -> list:
    posts = []
    media_files = set()

    with zipfile.ZipFile(io.BytesIO(zip_data), 'r') as zf:
        # 모든 파일 목록 확인
        for name in zf.namelist():
            # media 파일 존재 여부 기록
            if name.startswith('media/'):
                media_files.add(name)

            # posts_*.json 파일 찾기
            if 'your_instagram_activity/media/' in name and re.match(r'.*posts_\d+\.json$', name):
                try:
                    content = zf.read(name).decode('utf-8')
                    data = json.loads(content)

                    if 'media' in data and isinstance(data['media'], list):
                        for idx, media in enumerate(data['media']):
                            posts.append({
                                'id': f'{name}-{idx}',
                                'uri': media.get('uri', ''),
                                'caption': media.get('title', ''),
                                'timestamp': media.get('creation_timestamp', 0),
                                'type': get_media_type(media),
                                'hasMediaFile': media.get('uri', '') in media_files
                            })
                except Exception as e:
                    print(f'Error parsing {name}: {e}')

    # 미디어 파일 존재 여부 업데이트
    for post in posts:
        post['hasMediaFile'] = post['uri'] in media_files

    # 타임스탬프 기준 정렬 (최신순)
    posts.sort(key=lambda x: x['timestamp'], reverse=True)

    return posts


def get_media_type(media: dict) -> str:
    uri = media.get('uri', '')
    metadata = media.get('media_metadata', {})

    if '.mp4' in uri or 'video_metadata' in metadata:
        return 'video'

    return 'image'
