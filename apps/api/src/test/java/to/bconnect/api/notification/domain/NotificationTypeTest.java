package to.bconnect.api.notification.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.core.domain.notification.NotificationArgs;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class NotificationTypeTest {

    @Test
    @DisplayName("타입별 메시지 템플릿이 args 로 렌더된다")
    void render_perType() {
        assertThat(NotificationType.CHAT_MESSAGE.render(NotificationArgs.senderName("홍길동")))
                .isEqualTo("홍길동님이 메시지를 보냈습니다");
        assertThat(NotificationType.COWORKER_REQUESTED.render(NotificationArgs.senderName("가현")))
                .isEqualTo("가현 님으로부터 동료 요청을 제안받았습니다");
        assertThat(NotificationType.OFFER_RECEIVED.render(NotificationArgs.companyName("비커넥트")))
                .isEqualTo("비커넥트으로부터 섭외 요청을 제안받았습니다");
        assertThat(NotificationType.CONTRACT_WRITTEN.render(NotificationArgs.senderName("가현")))
                .isEqualTo("가현 님으로부터 계약서를 작성받았습니다");
    }

    @Test
    @DisplayName("placeholder 없는 시스템 알림은 args 없이 그대로 렌더된다")
    void render_noArgs() {
        assertThat(NotificationType.SIGNUP_WELCOME.render(NotificationArgs.empty()))
                .isEqualTo("회원가입을 축하드립니다");
        assertThat(NotificationType.PROFILE_COMPLETION.render(NotificationArgs.empty()))
                .isEqualTo("프로필을 완성하고 업체로부터 일감을 받아보세요");
    }

    @Test
    @DisplayName("link 는 reference_type + reference_id 로 만들고, NONE 은 이동 없음(null)")
    void link_byReferenceType() {
        assertThat(NotificationType.CHAT_MESSAGE.link(50L)).isEqualTo("/n/chat_room/50");
        assertThat(NotificationType.COWORKER_REQUESTED.link(7L)).isEqualTo("/n/coworker_request/7");
        assertThat(NotificationType.PROFILE_COMPLETION.link(null)).isEqualTo("/n/profile");
        assertThat(NotificationType.SIGNUP_WELCOME.link(null)).isNull();
    }

    @Test
    @DisplayName("from 은 코드로 타입을 찾고, 알 수 없는 코드엔 예외를 던진다")
    void from_lookup() {
        assertThat(NotificationType.from("CHAT_MESSAGE")).isEqualTo(NotificationType.CHAT_MESSAGE);
        assertThatThrownBy(() -> NotificationType.from("NOPE")).isInstanceOf(CodeException.class);
    }
}
