package to.bconnect.api.storage.notification;

import lombok.AllArgsConstructor;

@AllArgsConstructor
public enum NotificationType {

    CHAT_MESSAGE("%s님이 메시지를 보냈습니다"),

    SIGNUP_WELCOME("회원가입을 축하드립니다"),

    PROFILE_COMPLETION("프로필을 완성하고 업체로부터 일감을 받아보세요"),

    COWORKER_REQUESTED("%s 님으로부터 동료 요청을 제안받았습니다"),

    OFFER_RECEIVED("%s으로부터 섭외 요청을 제안받았습니다"),

    CONTRACT_WRITTEN("%s 님으로부터 계약서를 작성받았습니다");

    private final String template;

    public String render(String senderName) {
        return template.formatted(senderName);
    }
}
