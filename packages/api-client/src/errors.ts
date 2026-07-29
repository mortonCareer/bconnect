import { ApiError } from './client'

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function isRegisterMemberSignupSessionError(error: unknown): error is ApiError {
  return isApiError(error) && error.status === 400
}
