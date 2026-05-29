Feature: Auth API

  - 로그아웃: POST /api/v1/auth/logout (인증 필요)

  Background:
    * url baseUrl + '/api/v1/auth'

  Scenario: 로그아웃 성공
    * path 'logout'
    * header Authorization = 'Bearer ' + accessToken
    * method post
    * status 200
    * match response.success == true
