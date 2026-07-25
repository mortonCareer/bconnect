package to.bconnect.api.notification.domain;

import to.bconnect.api.core.domain.notification.NotificationEvent;

/**
 * 회원이 첫 push device 를 등록한 사건. 온보딩 알림(가입 축하 · 프로필 완성 제안)의 트리거.
 * 이 시점엔 device 가 막 등록돼 실제 push 가 도착하므로, 회원당 1회 온보딩 알림을 보낸다.
 */
public record MemberFirstDeviceRegisteredEvent(Long memberId) implements NotificationEvent {}
