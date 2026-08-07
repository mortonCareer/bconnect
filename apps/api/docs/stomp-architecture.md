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
    participant Msg as MessageManager
    participant Manager as MessageSocketManager
    participant Push as NotificationPushService
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
    Service->>Msg: create (메시지 영속화 · 첨부 연결)
    Service->>Manager: resolveActiveIds (구독자 조회)
    Service->>Service: 첨부 URL 조립
    Service->>Msg: markRead (구독자 읽음 처리)
    Service->>Manager: send (MessageResponse)
    Manager->>Broker: convertAndSend
    Broker-->>Client: /topic/{group|direct}-chats/{chatId} 브로드캐스트
    Service->>Push: push (미구독 참여자)
```


## 컴포넌트 구성
- WebSocketConfig : WebSocket 설정
- WebSocketAuthInterceptor : STOMP 연결시 인증 처리
- WebSocketSecurityConfig : WebSocket 보안 설정
- WebSocketAuthorizationConfig : 인가 규칙 등록
  - GroupChatAuthorizationManager : 그룹 채팅방 인가 처리
  - DirectChatAuthorizationManager : 1:1 채팅방 인가 처리
- MessageSocketController : 실시간 송신 STOMP 엔드포인트 (group · direct)
- MessageSocketService : 메시지 퍼사드 서비스
- MessageSocketManager : 실시간 메시지 전송 · 구독자 조회
- MessageManager : 메시지 영속화 · 읽음 처리
- MessageFinder : 메시지 목록 · 미읽음 카운트 조회

## 래퍼런스
- [Spring WebSocket : STOMP](https://docs.spring.io/spring-framework/reference/web/websocket/stomp.html)
