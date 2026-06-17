package to.bconnect.api.support.fixture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import to.bconnect.api.storage.chat.ParticipantEntity;
import to.bconnect.api.storage.chat.ParticipantRepository;

@Component
public class ParticipantFactory {

    @Autowired private ParticipantRepository participantRepository;

    public ParticipantEntity create(Long chatId, Long memberId) {
        return participantRepository.save(new ParticipantEntity(chatId, memberId, 0L));
    }
}
