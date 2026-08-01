package to.bconnect.api.core.domain.member;

/** 회원가입 사건. 온보딩 알림(가입 축하 · 프로필 완성 제안)의 트리거. */
public record MemberRegisteredEvent(Long memberId) {}
