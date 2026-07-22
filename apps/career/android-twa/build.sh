#!/usr/bin/env bash
set -euo pipefail

# career TWA 재빌드 — twa-manifest.template.json 변경(아이콘/이름/버전) 후 실행.
# 산출: app-release-signed.apk(사이드로드) + app-release-bundle.aab(Play).
#
# 사용법: ./build.sh [dev|prod]   (기본 prod)
#   - prod: host=career.bconnect.to (Play/실서비스)
#   - dev : host=career.dev.bconnect.to (사이드로드 테스트)
#   host 파생 필드(host·iconUrl·webManifestUrl·shortcut 아이콘)는 템플릿에서 생성됨.
#
# 사전조건:
#   - ./setup-toolchain.sh 로 JDK17 + Android SDK + bubblewrap 설정 완료
#   - android.keystore 가 이 디렉토리에 존재 (레포 밖 보관본을 복사해 둘 것 — README 참조)
#   - 서명 패스워드를 환경변수로 주입 (하드코딩 금지):
#       export TWA_KEYSTORE_PASSWORD=... TWA_KEY_PASSWORD=...
#
# 주의: bubblewrap inquirer 는 stdin 을 소비한다. 모든 호출에 < /dev/null 로 readline
#       crash 를 막고, "yes |" 파이프는 로그 폭주하니 쓰지 않는다.

cd "$(dirname "$0")"

ENV="${1:-prod}"
case "$ENV" in
  dev) HOST="career.dev.bconnect.to" ;;
  prod) HOST="career.bconnect.to" ;;
  *) echo "ERROR: 인자는 dev|prod (기본 prod). 받은 값: '$ENV'" >&2; exit 1 ;;
esac

: "${TWA_KEYSTORE_PASSWORD:?export TWA_KEYSTORE_PASSWORD 필요}"
: "${TWA_KEY_PASSWORD:?export TWA_KEY_PASSWORD 필요}"

echo "=== twa-manifest.json 생성 (env=$ENV, host=$HOST) ==="
sed "s/__HOST__/${HOST}/g" twa-manifest.template.json > twa-manifest.json

if [[ ! -f android.keystore ]]; then
  echo "ERROR: android.keystore 없음 — 레포 밖 보관본을 이 디렉토리에 복사하세요 (README 참조)" >&2
  exit 1
fi

export JAVA_HOME="$HOME/jdk17"
export PATH="$JAVA_HOME/bin:$PATH"
export BUBBLEWRAP_KEYSTORE_PASSWORD="$TWA_KEYSTORE_PASSWORD"
export BUBBLEWRAP_KEY_PASSWORD="$TWA_KEY_PASSWORD"

echo "=== update (twa-manifest.json → android project 재생성) ==="
bubblewrap update --skipVersionUpgrade < /dev/null

echo "=== build ==="
bubblewrap build --skipPwaValidation < /dev/null

echo
echo "산출물:"
ls -la app-release-signed.apk app-release-bundle.aab
echo "사이드로드: app-release-signed.apk 를 폰에 복사 후 설치 (같은 키라 기존 앱 위 업데이트)"
