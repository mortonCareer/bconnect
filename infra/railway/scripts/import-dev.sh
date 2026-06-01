#!/usr/bin/env bash
# dev(staging) 환경 — GUI prod 복제로 만들어진 리소스를 TF state 로 흡수.
# infra/ 루트(backend·모듈 보유)에서 terraform import 실행.
# 멱등: 이미 state 에 있으면 skip. service_domain(api_dev)은 부재 → import 안 함(apply 시 create).
set -euo pipefail

cd "$(dirname "$0")/../.."   # → infra/

PROJECT_ID="90cd6d09-4c7b-415f-b13f-3d6b6051769a"
API_SVC="831fe58d-b966-4af1-b517-128e205c77b3"
PG_SVC="1b00b504-e28e-4a58-a78c-dfbaba713fbc"
PG_TCP_PROXY_ID="28dcbe10-599f-4a9e-b842-4e68cf4b0543"
ENV="dev"
ENV_ID="c0ed38c7-08ae-40c1-8a4f-cf09cbaf008a"

# resource_label : import_id
declare -A IMPORTS=(
  ["railway_environment.dev"]="${PROJECT_ID}:${ENV}"
  ["railway_tcp_proxy.postgres_dev"]="${PG_SVC}:${ENV_ID}:${PG_TCP_PROXY_ID}"

  # api service variables (import id: service_id:env_name:var_name)
  ["railway_variable.dev_api_database_url"]="${API_SVC}:${ENV}:DATABASE_URL"
  ["railway_variable.dev_api_database_username"]="${API_SVC}:${ENV}:DATABASE_USERNAME"
  ["railway_variable.dev_api_database_password"]="${API_SVC}:${ENV}:DATABASE_PASSWORD"
  ["railway_variable.dev_api_spring_profiles"]="${API_SVC}:${ENV}:SPRING_PROFILES_ACTIVE"
  ["railway_variable.dev_api_jwt_secret"]="${API_SVC}:${ENV}:JWT_SECRET"
  ["railway_variable.dev_api_aws_access_key"]="${API_SVC}:${ENV}:AWS_ACCESS_KEY_ID"
  ["railway_variable.dev_api_aws_secret_key"]="${API_SVC}:${ENV}:AWS_SECRET_ACCESS_KEY"
  ["railway_variable.dev_api_aws_region"]="${API_SVC}:${ENV}:AWS_REGION"
  ["railway_variable.dev_api_s3_bucket"]="${API_SVC}:${ENV}:AWS_S3_BUCKET"
  ["railway_variable.dev_api_solapi_api_key"]="${API_SVC}:${ENV}:SOLAPI_API_KEY"
  ["railway_variable.dev_api_solapi_api_secret"]="${API_SVC}:${ENV}:SOLAPI_API_SECRET"
  ["railway_variable.dev_api_solapi_sender_number"]="${API_SVC}:${ENV}:SOLAPI_SENDER_NUMBER"
  ["railway_variable.dev_api_jdk_version"]="${API_SVC}:${ENV}:RAILPACK_JDK_VERSION"
  ["railway_variable.dev_api_java_tool_options"]="${API_SVC}:${ENV}:JAVA_TOOL_OPTIONS"
  ["railway_variable.dev_api_sentry_dsn"]="${API_SVC}:${ENV}:SENTRY_DSN"
  ["railway_variable.dev_api_sentry_environment"]="${API_SVC}:${ENV}:SENTRY_ENVIRONMENT"

  # postgres service variables
  ["railway_variable.dev_postgres_user"]="${PG_SVC}:${ENV}:POSTGRES_USER"
  ["railway_variable.dev_postgres_password"]="${PG_SVC}:${ENV}:POSTGRES_PASSWORD"
  ["railway_variable.dev_postgres_db"]="${PG_SVC}:${ENV}:POSTGRES_DB"
)

existing="$(terraform state list || true)"

for label in "${!IMPORTS[@]}"; do
  addr="module.railway.${label}"
  if grep -qxF "$addr" <<<"$existing"; then
    echo "skip (already in state): $addr"
    continue
  fi
  echo "import: $addr  <=  ${IMPORTS[$label]}"
  terraform import "$addr" "${IMPORTS[$label]}"
done

echo "done. 다음: terraform plan (예상: delta 5 in-place update + api_dev domain 1 create)"
