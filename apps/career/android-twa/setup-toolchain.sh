#!/usr/bin/env bash
set -euo pipefail

# career TWA 빌드 툴체인 셋업 (JDK17 + Android cmdline-tools + Bubblewrap 설정).
# 최초 1회 또는 툴체인 유실 시 실행. 자세한 함정은 README.md 참조.

echo "[1/5] JDK17 (Temurin) download + extract"
rm -rf ~/.bubblewrap/jdk
rm -rf ~/jdk17 && mkdir -p ~/jdk17
curl -fSL -o /tmp/jdk17.tar.gz "https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.11%2B9/OpenJDK17U-jdk_x64_linux_hotspot_17.0.11_9.tar.gz"
tar -xzf /tmp/jdk17.tar.gz -C ~/jdk17 --strip-components=1
export JAVA_HOME="$HOME/jdk17"
export PATH="$JAVA_HOME/bin:$PATH"
java -version

echo "[2/5] Android cmdline-tools download + extract"
rm -rf ~/android-sdk && mkdir -p ~/android-sdk/cmdline-tools
curl -fSL -o /tmp/cmdtools.zip "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
unzip -q /tmp/cmdtools.zip -d ~/android-sdk/cmdline-tools
mv ~/android-sdk/cmdline-tools/cmdline-tools ~/android-sdk/cmdline-tools/latest
SDKM="$HOME/android-sdk/cmdline-tools/latest/bin/sdkmanager"

echo "[3/5] accept licenses"
yes | "$SDKM" --sdk_root="$HOME/android-sdk" --licenses > /dev/null 2>&1 || true

# build-tools 34.0.0 는 필수 — bubblewrap core 가 BUILD_TOOLS_VERSION 을 34.0.0 로 핀하고
# 서명에 build-tools/34.0.0/apksigner·zipalign 경로를 쓴다. 35.0.0 만으론 빌드 실패.
echo "[4/5] install platform-tools + platforms;android-35 + build-tools 34.0.0(필수)·35.0.0"
"$SDKM" --sdk_root="$HOME/android-sdk" \
  "platform-tools" "platforms;android-35" \
  "build-tools;34.0.0" "build-tools;35.0.0" 2>&1 | tail -3

echo "[5/5] write bubblewrap config + doctor"
mkdir -p ~/.bubblewrap
printf '{"jdkPath":"%s/jdk17","androidSdkPath":"%s/android-sdk"}\n' "$HOME" "$HOME" > ~/.bubblewrap/config.json
cat ~/.bubblewrap/config.json
echo "--- doctor ---"
bubblewrap doctor < /dev/null 2>&1 | tail -10
echo "DONE_TOOLCHAIN_SETUP"
