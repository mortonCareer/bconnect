#!/usr/bin/env python3
"""
커밋 전 변경사항 요약 및 승인 요청 Hook
COMMIT_APPROVED=1 환경변수로 승인 우회
"""
import json
import sys
import re
import os
import subprocess


def extract_commit_message(command):
    """커밋 메시지 추출"""
    # HEREDOC 형식: git commit -m "$(cat <<'EOF' ... EOF)"
    heredoc_match = re.search(r"<<'?EOF'?\n(.+?)\nEOF", command, re.DOTALL)
    if heredoc_match:
        # 첫 번째 줄만 추출 (제목)
        return heredoc_match.group(1).strip().split('\n')[0]
    
    # -m "message" 형식
    msg_match = re.search(r'-m\s+["\'](.+?)["\']', command)
    if msg_match:
        return msg_match.group(1)
    
    return "(커밋 메시지 없음)"


def main():
    # 승인된 커밋이면 통과
    if os.environ.get("COMMIT_APPROVED") == "1":
        sys.exit(0)

    # stdin에서 도구 입력 읽기
    try:
        data = json.load(sys.stdin)
    except:
        sys.exit(0)

    command = data.get("tool_input", {}).get("command", "").strip()

    # git commit 명령이 아니면 통과
    if not re.match(r"^git\s+commit\b", command):
        sys.exit(0)

    # 프로젝트 디렉토리로 이동
    project_dir = os.environ.get("CLAUDE_PROJECT_DIR", "/home/json/morton")
    os.chdir(project_dir)

    # 1. 커밋 메시지 추출
    commit_message = extract_commit_message(command)

    # 2. 변경된 파일 목록 (staged + unstaged)
    try:
        status_output = subprocess.run(
            ["git", "status", "--short"],
            capture_output=True,
            text=True,
            check=True
        ).stdout.strip()
    except subprocess.CalledProcessError:
        sys.exit(0)  # git 명령 실패 시 통과

    if not status_output:
        # 변경사항 없으면 통과
        sys.exit(0)

    # 3. 변경 통계
    try:
        stat_output = subprocess.run(
            ["git", "diff", "--stat", "HEAD"],
            capture_output=True,
            text=True,
            check=True
        ).stdout.strip()
    except subprocess.CalledProcessError:
        stat_output = ""

    # 4. 파일 개수
    file_count = len([line for line in status_output.split('\n') if line])

    # 5. 요약 출력
    print("━" * 60, file=sys.stderr)
    print("📝 커밋 전 확인\n", file=sys.stderr)
    print(f"메시지: {commit_message}\n", file=sys.stderr)
    print(f"변경 파일 ({file_count}개):", file=sys.stderr)

    for line in status_output.split('\n'):
        if line:
            print(f"  {line}", file=sys.stderr)

    if stat_output:
        print("", file=sys.stderr)
        # 통계 마지막 줄만 표시 (전체 요약)
        stat_lines = stat_output.split('\n')
        for line in stat_lines:
            if line and ('file' in line or 'insertion' in line or 'deletion' in line):
                print(f"  {line}", file=sys.stderr)

    print("\n" + "━" * 60, file=sys.stderr)
    print("⚠️  커밋하시겠습니까? (yes/no)\n", file=sys.stderr)
    print("[INFO] 승인 후 에이전트가 COMMIT_APPROVED=1 환경변수로 재실행합니다.", file=sys.stderr)
    print("━" * 60, file=sys.stderr)

    # 차단 (사용자 승인 대기)
    sys.exit(2)


if __name__ == "__main__":
    main()
