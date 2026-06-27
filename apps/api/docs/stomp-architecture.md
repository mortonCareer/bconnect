# stomp-architecture
- 위치 : `/socket`
- 범위 : 채팅(Chat), 메시지(Message)

## 클래스 구조
- WebSocketConfig : WebSocket 설정
- WebSocketAuthInterceptor : STOMP 연결시 인증 처리
- WebSocketSecurityConfig : WebSocket 보안 설정
- GroupChatAuthorizationManager : 그룹 채팅방 인가 처리
- DirectChatAuthorizationManager : 1:1 채팅방 인가 처리