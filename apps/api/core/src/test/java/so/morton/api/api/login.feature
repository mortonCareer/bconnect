@ignore
Feature: Login helper

  - karate.callSingle 로 전역 1회 호출 및 캐싱한다.

  Scenario:
    * url baseUrl + '/api/v1/auth/otp/verify'
    * request { phone: '#(phone)', code: '#(code)' }
    * method post
    * status 200
    * match response.success == true
    * match response.data.registered == true
    * def accessToken = response.data.accessToken
