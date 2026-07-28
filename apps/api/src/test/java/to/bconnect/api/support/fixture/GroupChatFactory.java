package to.bconnect.api.support.fixture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import to.bconnect.api.core.domain.chat.CreateGroupChat;
import to.bconnect.api.core.domain.chat.GroupChat;
import to.bconnect.api.storage.chat.GroupChatEntity;
import to.bconnect.api.storage.chat.GroupChatRepository;

import java.util.List;

import static to.bconnect.api.support.fixture.FixtureConstant.MIN_DATE_TIME;

@Component
public class GroupChatFactory {

    private static final Long UNREAD_COUNT = 0L;

    @Autowired private GroupChatRepository groupChatRepository;

    public GroupChatEntity entity() {
        return groupChatRepository.save(new GroupChatEntity("title"));
    }

    public static GroupChat domain(Long id, List<Long> participantIds) {
        return new GroupChat(id, "title", participantIds, null, UNREAD_COUNT,
                MIN_DATE_TIME, MIN_DATE_TIME);
    }

    public static CreateGroupChat command(List<Long> participantIds) {
        return new CreateGroupChat("title", participantIds);
    }
}
