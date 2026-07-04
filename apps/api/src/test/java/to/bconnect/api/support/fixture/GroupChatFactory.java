package to.bconnect.api.support.fixture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import to.bconnect.api.storage.chat.GroupChatEntity;
import to.bconnect.api.storage.chat.GroupChatRepository;

@Component
public class GroupChatFactory {

    @Autowired private GroupChatRepository groupChatRepository;

    public GroupChatEntity create() {
        return groupChatRepository.save(new GroupChatEntity("title"));
    }
}
