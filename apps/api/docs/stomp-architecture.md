# stomp-architecture
- 위치 : `/socket`
- 범위 : 채팅(Chat), 메시지(Message)

## 메시지 송수신 흐름

```mermaid
sequenceDiagram
    participant Client
    participant Interceptor as WebSocketAuthInterceptor
    participant Authz as AuthorizationManager
    participant Ctrl as MessageSocketController
    participant Service as MessageSocketService
    participant Broker as SimpleBroker

    Client->>Interceptor: CONNECT /ws (Authorization: Bearer)
    Interceptor->>Interceptor: access token 검증 (JwtProvider) · 회원 조회 (UserDetailsService)
    Interceptor-->>Client: CONNECTED (세션에 인증 주체 설정)

    Client->>Authz: SUBSCRIBE /topic/{group|direct}-chats/{chatId}
    Authz->>Authz: 참여자 인가 (Group · DirectChatAuthorizationManager)
    Authz->>Broker: 구독 등록

    Client->>Authz: SEND /app/{group|direct}-chats/{chatId}/messages
    Authz->>Authz: 참여자 인가 (Group · DirectChatAuthorizationManager)
    Authz->>Ctrl: 라우팅
    Ctrl->>Service: broadcast
    Service->>Service: 메시지 저장 · 첨부 연결 (MessageService)
    Service->>Service: 구독자 읽음 처리 (SimpUserRegistry)
    Ctrl->>Broker: MessageResponse (@SendTo · 첨부 URL 조립)
    Broker-->>Client: /topic/{group|direct}-chats/{chatId} 브로드캐스트
```

## 컴포넌트 구성
- WebSocketConfig : WebSocket 설정
- WebSocketAuthInterceptor : STOMP 연결시 인증 처리
- WebSocketSecurityConfig : WebSocket 보안 설정
- WebSocketAuthorizationConfig : 인가 규칙 등록
  - GroupChatAuthorizationManager : 그룹 채팅방 인가 처리
  - DirectChatAuthorizationManager : 1:1 채팅방 인가 처리
- MessageSocketController : 메시지 송신 STOMP 엔드포인트 (group · direct)
- MessageSocketService : 메시지 브로드캐스트 · 첨부 연결

## 래퍼런스
- [Spring WebSocket : STOMP](https://docs.spring.io/spring-framework/reference/web/websocket/stomp.html)
