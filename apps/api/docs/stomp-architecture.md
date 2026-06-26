# stomp-architecture
- 위치 : `/socket`
- 범위 : 채팅(Chat), 메시지(Message)

## 클래스 구조
- GroupChatAuthorizationManager : 그룹 채팅방 인가 처리 (참여자 검사)
- DirectChatAuthorizationManager : 1:1 채팅방 인가 처리 (minId/maxId 검사)
- WebSocketAuthInterceptor : WebSocket 연결시 인증 처리
- WebSocketAuthorizationConfig : 엔드포인트에 따른 보안 설정
- WebSocketConfig : STOMP 설정
- WebSocketSecurityConfig : CSRF 비활성화를 위한 보안 설정 ([자세히보기](https://docs.spring.io/spring-security/reference/servlet/integrations/websocket.html#websocket-sameorigin-disable))
