# 릴리스 (dev → main)

> **For**: dev → main 릴리스를 수행하는 사람.
> **You'll be able to**: 릴리스 PR 생성부터 merge commit 머지, 태그, 릴리스 노트, APK 첨부, 배포 확인까지 수행.

v0.1.0([#1024](https://github.com/mortonCareer/bconnect/pull/1024), 2026-07-23)에서 확립한 절차. 배포 파이프라인 자체는 [deployment.md](./deployment.md), 브랜치 전략은 [git-workflow.md](./git-workflow.md) 참조.

---

## 사전 조건

- dev 환경 스프린트 QA 완료
- **버전 번호 결정**: 버전은 제품 마일스톤으로 회의에서 정한다 (예: `v1.0.0` = 매칭). 커밋 타입 기반 자동 산정(semver bot)은 쓰지 않는다 — [#1035](https://github.com/mortonCareer/bconnect/issues/1035) 검토에서 반려.

## 절차

### 1. 릴리스 PR 생성

```bash
gh pr create --base main --head dev \
  --title "chore(release): vX.Y.Z — dev → main 통합" \
  --body-file <개괄 본문>
```

### 2. 통합 CI 확인

`integration` 체크(api:generate → typecheck → 전 앱 빌드)가 green인지 확인한다. 실패 시 dev에서 수정 후 재시도.

### 3. 머지 — 반드시 merge commit

> ⚠️ **"Create a merge commit" 버튼만 사용한다. squash 절대 금지.**
>
> squash는 main/dev 히스토리를 분기시켜 다음 릴리스 PR이 대량 충돌로 막힌다. merge commit은 dev의 PR 단위 히스토리를 main이 그대로 흡수한다 ([git-workflow.md](./git-workflow.md) 머지 전략 표 참조).

### 4. 태그 + GitHub Release

```bash
git fetch origin main
git tag vX.Y.Z <머지 커밋 SHA>
git push origin vX.Y.Z
gh release create vX.Y.Z --title "vX.Y.Z" --generate-notes
```

`--generate-notes`는 직전 태그 이후 머지된 PR을 [.github/release.yml](../../.github/release.yml)의 레이블 매핑대로 섹션 분류해 노트를 만든다. 분류 기준은 **PR에 붙은 레이블**이므로 (이슈 레이블 아님) PR 생성 시 레이블을 붙여야 노트에 제대로 분류된다.

### 5. 릴리스 산출물 — career TWA APK 첨부

career 안드로이드 앱(apk)은 [release-apk 워크플로](../../.github/workflows/release-apk.yml)가 **자동 첨부**한다: TWA 메타(`twa-manifest.template.json`)가 직전 릴리스와 같으면 직전 apk를 그대로 복사 첨부한다 (TWA는 라이브 URL 로드라 메타 불변이면 동일 apk 유효).

수동 개입이 필요한 경우 — 워크플로가 릴리스 본문에 ⚠️ 안내를 남긴다:

- **메타 변경 시** (이름·아이콘·host·`appVersionCode`): 재빌드 후 첨부. 빌드 절차·키스토어·서명은 [android-twa/README.md](../../apps/career/android-twa/README.md)가 SSOT.
- **최초 릴리스 / 직전 apk 부재 시**: 아래 명령으로 첨부.

```bash
# (메타 변경 시) 재빌드 — appVersionCode +1 필수
cd apps/career/android-twa && ./build.sh prod

# Release에 첨부
gh release upload vX.Y.Z apps/career/android-twa/app-release-signed.apk
```

### 6. 배포 확인

main 푸시로 Vercel(career·plan·landing)과 Railway(api)가 자동 배포된다. 배포 성공 여부는 Vercel·Railway 대시보드 로그로 확인한다 (실패 시 슬랙 알림). 주요 기능 스모크와 롤백은 [deployment.md](./deployment.md) 참조.
