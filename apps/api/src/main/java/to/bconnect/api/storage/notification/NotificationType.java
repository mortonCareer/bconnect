package to.bconnect.api.storage.notification;

import lombok.AllArgsConstructor;

@AllArgsConstructor
public enum NotificationType {

    CHAT_MESSAGE("%s님이 메시지를 보냈습니다"),

    SIGNUP_WELCOME("회원가입을 축하드립니다"),

    PROFILE_COMPLETION("프로필을 완성하고 업체로부터 일감을 받아보세요"),

    PROFILE_COMPLETED("프로필이 완성되었습니다"),

    NEW_DEVICE_LOGIN("새로운 기기에서 로그인되었습니다"),

    DEVICE_REGISTERED("알림 수신 설정이 완료되었습니다"),

    CREDENTIAL_ACCEPTED("자격 증명이 승인되었습니다"),

    CREDENTIAL_DENIED("자격 증명이 반려되었습니다"),

    COWORKER_REQUESTED("%s 님으로부터 동료 요청을 제안받았습니다"),

    COWORKER_ACCEPTED("%s 님이 동료 요청을 수락했습니다"),

    OFFER_RECEIVED("%s으로부터 섭외 요청을 제안받았습니다"),

    OFFER_SENT("%s님에게 섭외 요청이 전달되었습니다"),

    OFFER_ACCEPTED("%s님이 섭외 요청을 수락했습니다"),

    OFFER_ACCEPT_COMPLETED("%s의 섭외 요청을 수락했습니다"),

    OFFER_DENIED("%s님이 섭외 요청을 거절했습니다"),

    RECOMMENDATION_WRITTEN("%s 님으로부터 추천서를 작성받았습니다"),

    CONTRACT_WRITTEN("%s 님으로부터 계약서를 작성받았습니다"),

    TASK_COMPLETED("작업이 완료되었습니다"),

    TASK_UPDATED("작업 내용이 변경되었습니다"),

    DRIVE_SHARED("%s 님이 드라이브를 공유했습니다"),

    DRIVE_NOTE_CREATED("%s 님이 노트를 작성했습니다");

    private final String template;

    public String render(String senderName) {
        return template.formatted(senderName);
    }
}
