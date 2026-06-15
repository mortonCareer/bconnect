# 품앗이 PWA 출시 계획 (career Play Store + plan 웹 공개)

> **For**: 이 출시를 실행·추적하는 사람 (CTO, CEO, FE).
> **You'll be able to**: 6월 말 소프트런칭 → 7월 초 Play 공개까지 **누가·언제·무엇을** 하는지와, 코드/스토어 작업 목록을 안다.

> 작성 2026-06-15. 결정 근거는 같은 날 CTO↔Claude 검토 + TWA 스파이크 e2e 검증.

---

## 1. 목표

- **career**: Google Play Store 안드로이드 출시 (TWA). 실제 다운로드·설치까지.
- **plan**: 웹 공개 런칭 (도메인 등록 완료, 잔여 누락분 정리).
- **마감 목표**: 6월 말.

## 2. 핵심 제약 — 왜 공개는 7월 초인가

품앗이 사업자등록이 **2026-05-31(신규)** → D-U-N-S 없음. 이게 Play 공개 타임라인을 결정한다.

- **신규 개인 Play 계정**: production 승격 전 **비공개테스트 12명 × 14일 연속** 의무 (2023-11 정책, 회피 불가).
- **조직 계정**: 위 테스트 면제, 단 **D-U-N-S 발급 최대 30영업일**.

→ 어느 경로든 6/30 Play **공개 production** 은 물리적으로 불가. 빨라야 7월 초.

**수용 결론(2026-06-15)**: 6월 말 = **소프트런칭**(실기기 설치 가능), 공개 production 은 7월 초.

## 3. 계정 전략 (CEO 소유)

계정 생성 + D-U-N-S 신청은 **CEO 담당**. day-1 착수가 병목 단축의 관건(외부 시계).

- **개인 Play 계정**(새 Gmail): 6월 소프트런칭 vehicle. 비공개테스트 14일 시계를 가장 빨리 점화.
- **조직 Play 계정**(회사 Gmail) + D-U-N-S: 영구집, 7월. 준비되면 **앱 이관**(개인→조직, Google 공식 transfer, 설치수·리뷰 보존).
- 비용 각 $25 (계정유형별 Google 계정 분리).
- Play 계정유형(개인/조직)은 **등록 시 선택** — Gmail 가입 "개인/비즈니스" 라벨과 무관.

## 4. 6월 말 달성 범위

- **plan 웹**: 완전 공개 (외부 게이트 0, 코드만 끝내면 즉시).
- **career**: ① PWA 직접설치(bconnect.to "홈 화면에 추가") ② Play **비공개테스트 트랙** 실기기 설치 (14일 의무는 production 게이트일 뿐, 트랙 설치는 즉시).
- **career 공개 production**: 14일 테스트 + 심사 → 7월 초 자동 승격.

## 5. TWA 기술 접근 — 검증 완료

도구 = **Bubblewrap** (Google 공식 CLI). 근거: `twa-manifest.json` 단일 파일 git 관리(선언적), 웹 변경 시 앱 재빌드 불필요(라이브 URL 로드), CI 자동화 용이. (대안 PWABuilder=GUI 전용 탈락, Capacitor=웹 번들 재빌드+정책 리스크 탈락.)

**2026-06-15 스파이크로 end-to-end 검증**: dev.bconnect.to PWA → Bubblewrap 패키징 → 서명 APK → Galaxy Z Flip5 설치 → assetlinks 배포 → 도메인 검증 → 풀스크린. packageId `to.bconnect.career`.

빌드 환경 셋업 함정(JDK17 Temurin 수동, build-tools 34.0.0 핀, SDK `tools` 심링크, 비대화식 플래그 등)은 auto-memory `reference-morton-twa-bubblewrap-build` 에 정리.

## 6. 작업 영역

세 갈래로 묶는다. **공유 선결**이 양쪽을 막고, **plan 웹**과 **career**는 병렬 진행 (순차 단계가 아님 — 시간순은 §7 타임라인).

### 공유 선결 (career·plan 양쪽 차단요소)

- [ ] **auth 가드 재활성화**: [apps/plan/src/proxy.ts](../../../apps/plan/src/proxy.ts) + [apps/career/src/proxy.ts](../../../apps/career/src/proxy.ts) — 현재 "인증 보호 임시 해제" 상태. 공개 시 보호 라우트 노출되는 치명 이슈.
- [ ] **법적 페이지**: 개인정보처리방침 + 이용약관. **Play 제출 개인정보처리방침 URL + 웹런칭 동시 충족**. 양쪽 도메인(bconnect.to / plan.bconnect.to)에서 서빙. ⚠️ 콘텐츠 출처(표준 템플릿 vs 법무 검토) 결정 필요.

### plan 웹 공개 런칭

이미 OK(스파이크 audit 확인): SEO 기본 메타, robots, sitemap, favicon, 도메인(plan.bconnect.to), Sentry, env 검증, MSW 프로덕션 가드, manifest.

- [ ] OG/Twitter 공유 이미지 (1200×630) — `apps/plan/public/opengraph-image.*`
- [ ] (권장) `@vercel/analytics` — Core Web Vitals
- [ ] (선택) sitemap 동적 라우트 확장

### career ① 웹/PWA prod 준비

- [ ] **prod 배포**: bconnect.to 현재 미배포(curl 000). career prod 배포 — TWA 최종 빌드·assetlinks 의 선행조건.
- [ ] **assetlinks.json (prod)**: prod 는 **Play App Signing 인증서 SHA-256**(Play Console 발급) — 로컬/업로드 키 지문 아님(Play 가 AAB 재서명). 배열에 dev 키 + Play 키 공존 가능. (dev assetlinks 는 PR #620 로 머지됨)
- [ ] maskable 아이콘 (Play 어댑티브 아이콘)
- [ ] SW 오프라인 폴백 — 현 FCM 전용 SW 는 오프라인 200 응답 없음 → Play 품질심사 리스크

### career ② TWA 빌드

- [ ] **TWA 소스 repo 등록**: `twa-manifest.json`(SSOT)을 repo 에 커밋 (위치 제안 `apps/career/twa/`). 파생물(android 프로젝트 `app/`·gradle, `*.keystore`, `*.aab`/`*.apk`)은 `.gitignore` → `bubblewrap update`/`build` 로 재생성. 키스토어·서명 비밀번호는 **시크릿**(git 금지, CI 는 Actions secret 주입). ⚠️ 현재 `/home/json/twa-spike` scratch 에만 있고 repo 미등록. 스파이크 파일은 host=dev + 스파이크 키라 그대로 못 씀 — 최종본은 host=bconnect.to + Play 서명.
- [ ] Bubblewrap 빌드 → `.aab` (Play App Signing 옵트인)
- [ ] 키스토어/업로드 키 안전 보관 (현 스파이크 키는 로컬 → 시크릿화)

### career ③ Play 제출

- [ ] **리스팅 자료**: 피처그래픽 1024×500, 스크린샷 ≥2장(태블릿 타겟 시 4장), 제목 30자/짧은설명 80자/전체 4000자
- [ ] 콘텐츠등급 (IARC 설문)
- [ ] 데이터 안전 양식 (폰 OTP·프로필·푸시토큰 선언)
- [ ] targetSDK 35 확인 (Play 신규앱 API 35 의무)

## 7. 타임라인

| 시점         | 작업                                                              | 담당    |
| ------------ | ----------------------------------------------------------------- | ------- |
| day-1        | 개인 계정 생성+신원검증, 조직 계정+D-U-N-S 신청, 테스터 12명 확보 | CEO     |
| 병렬         | §6 코드 작업 (공유·plan·career)                                   | CTO·FE  |
| .aab 준비 후 | 비공개테스트 트랙 업로드 → 12명 opt-in → **14일 시계 점화**       | CTO·CEO |
| 6/30         | plan 웹 공개 + career 실설치(PWA + 테스트트랙)                    | —       |
| 7월 초       | 14일 + 심사 → Play **공개 production**. 조직 준비 시 앱 이관      | —       |

> 빌드 속도가 14일 시계 점화 시점을 결정 — career TWA 빌드의 .aab 가 빨리 나와야 공개도 앞당겨짐.

## 8. 미해결 / 리스크

- 법적 페이지 콘텐츠 출처 (템플릿 vs 법무 검토)
- prod `bconnect.to` 배포 일정 (TWA 최종 빌드 선행)
- 키스토어 / Play App Signing 관리 방안 확정

## 9. 참고

- TWA 빌드 환경: auto-memory `reference-morton-twa-bubblewrap-build`
- 배포 환경/도메인: [도메인 현황](../domains.md), [배포](../../how-to/deployment.md)
- 계정·타임라인 결정 근거: 2026-06-15 검토 (auto-memory `project-career-play-launch-plan`)
