"""수집한 블로그 원본 저장/로드.

분류(is_professional) 전에 수집한 것을 걸러진 것까지 전부 파일에 보관한다.
한 줄에 블로그 하나(JSONL). 분류 방법을 바꿔도 이 원본만 있으면 다시 수집하지 않고
분류만 재실행할 수 있다(#920). reports/raw/ 아래에 쌓이며 지우지 않는다.
"""

import json
from datetime import datetime, timezone
from pathlib import Path

RAW_DIR = Path("reports/raw")


def raw_path(channel: str, stem: str | None = None) -> Path:
    """채널·시각 기반 원본 파일 경로. 예: reports/raw/naver-2026-07-19_235900.jsonl"""
    stem = stem or datetime.now(timezone.utc).strftime("%Y-%m-%d_%H%M%S")
    return RAW_DIR / f"{channel}-{stem}.jsonl"


def append_raw(path: Path, record: dict) -> None:
    """원본 1건을 파일 끝에 이어붙인다(불변, 덮어쓰지 않음)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    record = {**record, "scraped_at": datetime.now(timezone.utc).isoformat()}
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


def load_raw(path: Path) -> list[dict]:
    """저장된 원본 전체를 읽어온다."""
    return [
        json.loads(line)
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
