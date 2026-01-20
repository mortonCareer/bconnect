# Figma 디자인 린트

Figma 디자인 파일의 컨벤션 준수 여부를 검사합니다.

## 사용법

```bash
/figma-lint <Figma URL>
```

예:

- `/figma-lint https://www.figma.com/design/xxx?node-id=1-2`

## 실행

### 1. Figma 정보 가져오기

```
get_variable_defs(fileKey, nodeId) → 사용된 변수 정의
get_metadata(fileKey, nodeId) → 노드 구조/이름
```

### 2. 검사 항목

#### 2.1 컬러 스타일 검사

- [ ] 하드코딩된 hex 컬러 사용 여부
- [ ] Figma Variables로 정의된 컬러 사용 권장

**허용:**

```
color/blue → #386DFF (Variable 사용)
greyscale/900 → #1B1B1B (Variable 사용)
```

**금지:**

```
Fill: #386DFF (하드코딩)
```

#### 2.2 프레임 이름 컨벤션

- [ ] 페이지: `{기능}/{상태}-{순번}-{설명}` 형식 준수
  - 예: `회원가입/본인인증-00-전화번호 입력`
- [ ] 컴포넌트: PascalCase 또는 kebab-case 사용

#### 2.3 Auto Layout 검사

- [ ] 고정 크기보다 Auto Layout 사용 권장
- [ ] 적절한 padding/gap 설정 여부

### 3. 결과 출력

```
✅ 통과: 컬러 변수 사용
⚠️ 경고: 프레임 이름 컨벤션 미준수 - "Frame 123"
❌ 에러: 하드코딩된 컬러 발견 - #FF0000
```

## 검사 레벨

| 레벨    | 설명            | 동작      |
| ------- | --------------- | --------- |
| error   | 코드 변환 불가  | 수정 필요 |
| warning | 권장사항 미준수 | 확인 필요 |
| info    | 참고 사항       | 무시 가능 |

## 관련 파일

- `.claude/hooks/post-edit.sh` - 코드에서 하드코딩 컬러 검사
- `packages/ui/figma-mapping.json` - Figma-코드 매핑
