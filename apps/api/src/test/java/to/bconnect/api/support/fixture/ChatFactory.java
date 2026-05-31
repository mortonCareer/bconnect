package to.bconnect.api.support.fixture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import to.bconnect.api.storage.domain.chat.ChatEntity;
import to.bconnect.api.storage.domain.chat.ChatRepository;

@Component
public class ChatFactory {

    @Autowired private ChatRepository chatRepository;

    public ChatEntity create() {
        return chatRepository.save(ChatEntity.builder()
                .title("title")
                .build());
    }
}
