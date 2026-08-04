package to.bconnect.api.support.fixture;

import to.bconnect.api.core.domain.chat.DirectChat;
import to.bconnect.api.storage.chat.DirectChatEntity;

import static to.bconnect.api.support.fixture.FixtureConstant.MIN_DATE_TIME;

public class DirectChatFactory {

    private static final Long UNREAD_COUNT = 0L;

    public static DirectChat domain(Long id, Long memberId) {
        return new DirectChat(id, memberId, null, UNREAD_COUNT,
                MIN_DATE_TIME, MIN_DATE_TIME);
    }

    public static DirectChatEntity entity(Long memberId, Long otherId) {
        return DirectChatEntity.of(memberId, otherId);
    }
}
