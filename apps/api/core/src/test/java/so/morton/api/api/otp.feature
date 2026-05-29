Feature: OTP API

  OTP 발송 및 검증 API
  - 발송: POST /api/v1/auth/otp/send
  - 검증: POST /api/v1/auth/otp/verify
  더미 데이터(data.sql) 기준으로 가입된 연락처와 미가입 연락처를 각각 검증한다.

  Background:
    * url baseUrl + '/api/v1/auth/otp'

  Scenario: OTP 발송 성공
    * path 'send'
    * request { phone: '01000000004' }
    * method post
    * status 200
    * match response.success == true

  Scenario: OTP 검증 - 가입된 연락처는 로그인 토큰을 발급한다
    * path 'verify'
    * request { phone: '01000000001', code: '000000' }
    * method post
    * status 200
    * match response.success == true
    * match response.data.registered == true
    * match response.data.accessToken == '#string'
    * match response.data.refreshToken == '#string'

  Scenario: OTP 검증 - 미가입 연락처는 가입 토큰을 발급한다
    * path 'verify'
    * request { phone: '01000000009', code: '000000' }
    * method post
    * status 200
    * match response.success == true
    * match response.data.registered == false
    * match response.data.signupToken == '#string'
