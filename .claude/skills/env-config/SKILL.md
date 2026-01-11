---
name: env-config
description: 환경 변수 추가, 수정, 삭제 시 관련 파일 모두 동기화. 새 환경변수 추가하거나 환경변수 관련 작업 시 자동으로 사용.
allowed-tools: Read, Edit, Write, Glob, Grep
---

# 환경 변수 관리

환경 변수를 CRUD할 때 관련된 모든 파일을 함께 수정합니다.

## 관련 파일 목록

### 1. 환경 변수 검증 (Zod 스키마)

- `packages/config/env/validate.ts` - 공통 스키마
- `apps/career/src/env.ts` - Career 앱 스키마 (있다면)
- `apps/plan/src/env.ts` - Plan 앱 스키마 (있다면)

### 2. 예시 파일 (.env.example)

- `apps/career/.env.example`
- `apps/plan/.env.example`

### 3. Terraform 환경 변수 리소스

- `infra/vercel/projects.tf` - Vercel 프로젝트 환경변수
- `infra/railway/spring.tf` - Railway API 환경변수
- `infra/railway/database.tf` - Railway DB 환경변수

### 4. 인프라 변수 정의

- `infra/variables.tf` - 루트 변수
- `infra/terraform.tfvars.example` - 변수 예시

## 작업 흐름

### 환경 변수 추가 시

1. **타입 확인**: 서버 전용 vs 클라이언트 공개 (`NEXT_PUBLIC_*`)
2. **Zod 스키마 추가**: `packages/config/env/validate.ts` 또는 앱별 `env.ts`
3. **.env.example 업데이트**: 해당 앱의 예시 파일
4. **Terraform 리소스 추가**:
   - Vercel 앱: `infra/vercel/projects.tf`
   - Railway API: `infra/railway/spring.tf`
5. **terraform.tfvars.example 업데이트** (민감하지 않은 경우)

### 환경 변수 수정 시

1. 위 파일들에서 변수명/타입 일괄 수정
2. 기존 값에 영향 있는지 확인

### 환경 변수 삭제 시

1. 사용처 검색 (`grep -r "변수명"`)
2. 사용처 없으면 위 파일들에서 일괄 삭제

## Zod 스키마 패턴

```typescript
// 서버 전용
DATABASE_URL: z.string().url(),

// 클라이언트 공개
NEXT_PUBLIC_API_URL: z.string().url(),

// 선택적
OPTIONAL_VAR: z.string().optional(),

// enum
NODE_ENV: z.enum(['development', 'production', 'test']),
```

## Terraform 패턴

```hcl
# Vercel
resource "vercel_project_environment_variable" "api_url" {
  project_id = vercel_project.career.id
  key        = "NEXT_PUBLIC_API_URL"
  value      = var.api_url
  target     = ["production", "preview"]
}

# Railway
resource "railway_variable" "database_url" {
  name           = "DATABASE_URL"
  value          = "jdbc:postgresql://..."
  environment_id = railway_environment.production.id
  service_id     = railway_service.api.id
}
```

## 주의사항

- 민감한 값은 절대 커밋하지 않음
- `terraform.tfvars`는 `.gitignore`에 포함
- `NEXT_PUBLIC_*` 접두사가 없으면 클라이언트에서 접근 불가
