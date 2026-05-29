Feature: Member API

  - 사용자명 중복 확인: GET /api/v1/members/check-username
  - 회원가입: POST /api/v1/members
  - 내 정보 조회: GET /api/v1/members/me (인증 필요)
  - 내 정보 수정: PUT /api/v1/members/me (인증 필요)
  - 회원 탈퇴: DELETE /api/v1/members/me (인증 필요)

  Background:
    * url baseUrl + '/api/v1/members'

  Scenario: 회원가입 성공
    * request { signupToken: 'signup-token-3', username: 'new-username', name: '새로운 이름', picture: 'https://image.com', role: 'FOREMAN' }
    * method post
    * status 200
    * match response.success == true
    * match response.data == '#number'

  Scenario: 사용자명 중복 확인 - 사용 가능
    * path 'check-username'
    * param username = 'available-username'
    * method get
    * status 200
    * match response.data.available == true

  Scenario: 사용자명 중복 확인 - 사용 불가능
    * path 'check-username'
    * param username = 'username1'
    * method get
    * status 200
    * match response.data.available == false

  Scenario: 내 정보 조회 성공
    * path 'me'
    * header Authorization = 'Bearer ' + accessToken
    * method get
    * status 200
    * match response.success == true

  Scenario: 내 정보 수정 성공
    * path 'me'
    * header Authorization = 'Bearer ' + accessToken
    * request { name: '이름', picture: 'https://image.com', role: 'CONTRACTOR' }
    * method put
    * status 200
    * match response.success == true

  Scenario: 회원 탈퇴
    * def login = call read('classpath:so/morton/api/api/login.feature') { phone: '01000000012', code: '000012' }
    * path 'me'
    * header Authorization = 'Bearer ' + login.accessToken
    * method delete
    * status 200
    * match response.success == true
