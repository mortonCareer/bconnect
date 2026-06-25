# stomp-architecture

## 범위
- `/socket`
- 채팅(Chat)
- 메시지(Message)
- 웹 소켓(WebSocket)
- STOMP

## 클래스 구조
- ChatAuthorizationManager : 인가 처리
- WebSocketAuthInterceptor : WebSocket 연결시 인증 처리
- WebSocketAuthorizationConfig : 엔드포인트에 따른 보안 설정
- WebSocketConfig : STOMP 설정
- WebSocketSecurityConfig : CSRF 비활성화를 위한 보안 설정 ([자세히보기](https://docs.spring.io/spring-security/reference/servlet/integrations/websocket.html#websocket-sameorigin-disable))
