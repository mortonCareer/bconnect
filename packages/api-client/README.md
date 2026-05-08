# @bconnect/api-client

OpenAPI 스펙 기반 타입 안전한 API 클라이언트 패키지

## 구조

```
packages/api-client/
├── src/
│   ├── index.ts           # 공개 exports
│   ├── client.ts          # ky 기반 HTTP 클라이언트 + customFetch
│   ├── query-client.ts    # QueryClient 설정
│   ├── openapi.yaml       # OpenAPI 스펙 (백엔드에서 제공)
│   └── generated/         # Orval 자동 생성 (git 제외)
│       ├── api.ts         # React Query hooks
│       └── schemas/       # TypeScript 타입
└── orval.config.ts        # Orval 설정
```

## 사용법

### 1. API 코드 생성

```bash
# 루트에서
pnpm api:generate

# 또는 패키지 내에서
pnpm generate
```

### 2. 컴포넌트에서 사용

```tsx
'use client'

import { useGetUsers, type User } from '@bconnect/api-client'

export function UserList() {
  const { data, isSuccess, error } = useGetUsers()

  if (error) return <div>Error: {(error as Error).message}</div>
  if (!isSuccess) return <div>Loading...</div>

  // isSuccess 이후 data는 User[]로 타입 확정
  return (
    <ul>
      {data.map((user: User) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

## 핵심 매커니즘

### API 응답 구조

백엔드 API는 모든 응답을 다음 형태로 래핑:

```json
// 성공
{ "success": true, "data": { ... } }

// 실패
{ "success": false, "error": { "code": "ERROR_CODE", "message": "설명" } }
```

### customFetch의 역할

`client.ts`의 `customFetch`가 이 래퍼를 처리:

1. API 호출
2. `success` 필드로 성공/실패 판단
3. 성공 시 `data` 필드만 추출하여 반환
4. 실패 시 `ApiError` throw

```
API 응답: { success: true, data: User[] }
    ↓ customFetch 처리
컴포넌트 수신: User[]
```

### 타입 흐름

```
openapi.yaml (스펙)
    ↓ orval generate
generated/api.ts (useGetUsers 등 hooks)
generated/schemas/ (User 등 타입)
    ↓ customFetch (래퍼 제거)
컴포넌트에서 User[] 타입으로 사용
```

## 인증

### Access Token

- 메모리에 저장 (`setAccessToken`, `getAccessToken`)
- 모든 요청에 `Authorization: Bearer {token}` 헤더 자동 추가

### Refresh Token

- httpOnly secure 쿠키에 저장 (백엔드 관리)
- 401 응답 시 자동으로 `/api/v1/auth/refresh` 호출
- 갱신 성공 시 원래 요청 재시도

```typescript
import { setAccessToken } from '@bconnect/api-client'

// 로그인 성공 후
setAccessToken(response.accessToken)

// 로그아웃 시
setAccessToken(null)
```

## 타입 Narrowing 패턴

React Query의 `isSuccess`를 활용한 타입 확정:

```tsx
const { data, isSuccess, error } = useGetUsers();

// ❌ data: User[] | undefined
if (isLoading) return <div>Loading...</div>;

// ✅ isSuccess 체크 후 data: User[]
if (!isSuccess) return <div>Loading...</div>;
data.map(...) // 타입 안전
```

## 환경 변수

| 변수                  | 설명                     | 기본값                  |
| --------------------- | ------------------------ | ----------------------- |
| `API_URL`             | 서버사이드 API URL       | `http://localhost:8080` |
| `NEXT_PUBLIC_API_URL` | 클라이언트사이드 API URL | `http://localhost:8080` |

## 스크립트

| 명령어                | 설명                         |
| --------------------- | ---------------------------- |
| `pnpm generate`       | OpenAPI 스펙에서 코드 생성   |
| `pnpm generate:watch` | 스펙 변경 감지하여 자동 생성 |
