# Architecture Decision Records

> **For**: 시스템 디자인 결정의 배경/대안/근거를 추적하려는 사람.
> **You'll be able to**: 어떤 결정이 언제, 왜 내려졌고 누가 결정했는지 확인한다.

ADR은 PR 리뷰 코멘트에 묻혀 사라지던 결정을 영구 기록한다. 작성 룰과 형식은 [`how-to/write-docs.md`](../../how-to/write-docs.md) 5장 참조.

새 ADR은 [`_template.md`](./_template.md) 복사로 시작한다. 인덱스는 디렉토리 listing(파일명 = 번호 + 제목)이 곧 표지.

## Status 의미

- **Proposed**: 작성 중, 아직 미결정
- **Accepted**: 결정되어 시행 중
- **Superseded by ADR-XXXX**: 다른 ADR에 의해 대체됨 (옛 ADR 본문은 역사 보존용으로 유지)
- **Deprecated**: 더 이상 유효하지 않으나 새 ADR로 명시적 대체 안 됨

## 번호 컨벤션

- 4자리 zero-padded: `0001`, `0042`
- 파일명: `<번호>-<kebab-case-제목>.md`
- 번호는 작성 순서. 영구. supersede되어도 번호는 유지
