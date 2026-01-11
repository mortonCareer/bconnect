# 사용 패턴 분석

Claude Code 세션 데이터를 분석하여 자동화 추천을 생성합니다.

## 분석 대상

1. **~/.claude/history.jsonl** - 전체 프롬프트 히스토리
2. **~/.claude/projects/-home-json-morton/\*.jsonl** - 이 프로젝트 세션들

## 분석 항목

### 1. 명령어 패턴 분석

```bash
# 자주 사용한 Bash 명령어 추출
cat ~/.claude/projects/-home-json-morton/*.jsonl | grep -oP '"command":"[^"]*"' | sort | uniq -c | sort -rn | head -30
```

### 2. 파일 접근 패턴 분석

```bash
# 자주 읽거나 수정한 파일 경로 추출
cat ~/.claude/projects/-home-json-morton/*.jsonl | grep -oP '"file_path":"[^"]*"' | sort | uniq -c | sort -rn | head -20
```

### 3. 도구 사용 빈도

```bash
# 도구별 사용 횟수
cat ~/.claude/projects/-home-json-morton/*.jsonl | grep -oP '"name":"(Bash|Edit|Write|Read|Glob|Grep)"' | sort | uniq -c | sort -rn
```

## 추천 생성 기준

### Command 추천 조건

- 동일한 명령어 패턴이 5회 이상 반복
- 여러 명령어가 순차적으로 자주 실행됨

### Skill 추천 조건

- 특정 파일 그룹이 함께 자주 접근됨
- 비슷한 질문/작업이 반복됨

### Hook 추천 조건

- 특정 도구 실행 후 항상 다른 작업이 뒤따름
- 반복적인 검증/포맷팅 패턴

## 출력 형식

분석 결과를 다음 형식으로 정리:

```markdown
## 추천 Commands

| 명령어 | 패턴 | 빈도 | 구현 제안 |

## 추천 Skills

| 스킬명 | 관련 파일/작업 | 이유 |

## 추천 Hooks

| 이벤트 | 트리거 | 액션 | 이유 |
```

## 실행

위 분석을 수행하고 현재 `.claude/commands/`, `.claude/skills/`에 이미 존재하는 것과 비교하여 새로운 추천만 제시하세요.
