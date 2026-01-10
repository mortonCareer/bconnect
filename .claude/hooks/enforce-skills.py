#!/usr/bin/env python3
"""
Bash 명령 실행 전 검증 hook.
git/gh 명령을 차단하고 스킬 사용을 강제합니다.
"""
import json
import sys
import re

# 차단할 명령 패턴과 대응 스킬
BLOCKED_COMMANDS = [
    {
        "pattern": r"^git\s+commit\b",
        "skill": "/commit",
        "description": "커밋 생성"
    },
    {
        "pattern": r"^git\s+(checkout\s+-b|switch\s+-c|branch\s+(?!-d|-D))\b",
        "skill": "/branch",
        "description": "브랜치 생성"
    },
    {
        "pattern": r"^gh\s+pr\s+create\b",
        "skill": "/pr",
        "description": "PR 생성"
    },
]

def main():
    try:
        data = json.load(sys.stdin)
    except:
        sys.exit(0)

    command = data.get("tool_input", {}).get("command", "").strip()

    for blocked in BLOCKED_COMMANDS:
        if re.match(blocked["pattern"], command):
            print(f"[BLOCKED] {blocked['description']}은 직접 실행할 수 없습니다.", file=sys.stderr)
            print(f"대신 '{blocked['skill']}' 스킬을 사용하세요.", file=sys.stderr)
            print(f"Skill 도구를 호출해서 skill=\"{blocked['skill'].lstrip('/')}\"로 실행하세요.", file=sys.stderr)
            sys.exit(2)

    sys.exit(0)

if __name__ == "__main__":
    main()
