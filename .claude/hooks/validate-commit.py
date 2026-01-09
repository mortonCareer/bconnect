#!/usr/bin/env python3
import json
import sys
import subprocess
import os
import re

def main():
    try:
        data = json.load(sys.stdin)
    except:
        sys.exit(0)

    command = data.get("tool_input", {}).get("command", "")

    # git commit 명령이 아니면 통과 (gh pr create 등 다른 명령 제외)
    if not re.match(r'^git commit\b', command.strip()):
        sys.exit(0)

    # 커밋 메시지 추출
    message = None

    # HEREDOC 패턴: <<'EOF' ... EOF
    heredoc_match = re.search(r"<<'EOF'\s*\n(.*?)\n.*?EOF", command, re.DOTALL)
    if heredoc_match:
        # 첫 번째 줄만 (subject)
        message = heredoc_match.group(1).split('\n')[0].strip()

    # -m "message" 패턴
    if not message:
        m_match = re.search(r'-m\s+["\']([^"\']+)["\']', command)
        if m_match:
            message = m_match.group(1)

    if not message:
        sys.exit(0)

    # commitlint 실행
    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())
    try:
        result = subprocess.run(
            ["pnpm", "exec", "commitlint"],
            input=message.encode(),
            capture_output=True,
            cwd=project_dir,
            timeout=10
        )

        if result.returncode != 0:
            print("commitlint 검증 실패:", file=sys.stderr)
            print(result.stdout.decode() + result.stderr.decode(), file=sys.stderr)
            sys.exit(2)
    except Exception as e:
        print(f"commitlint 실행 오류: {e}", file=sys.stderr)
        sys.exit(0)  # 오류 시 통과

    sys.exit(0)

if __name__ == "__main__":
    main()
