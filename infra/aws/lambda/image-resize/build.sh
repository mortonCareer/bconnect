#!/usr/bin/env bash
# sharp 네이티브 바이너리를 Lambda 타겟(linux/arm64)으로 설치한다.
# 로컬 아키텍처(WSL x64 / Mac arm64)와 무관하게 항상 linux/arm64 prebuilt 를 받는다.
# terraform apply 전 반드시 실행 — archive_file 이 이 폴더를 그대로 zip 한다.
# @aws-sdk/client-s3 는 nodejs22.x 런타임 기본 제공이라 번들하지 않는다(package.json 미포함).
set -euo pipefail
cd "$(dirname "$0")"

rm -rf node_modules
npm install --os=linux --cpu=arm64
