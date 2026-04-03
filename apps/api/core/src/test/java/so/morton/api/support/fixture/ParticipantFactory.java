package so.morton.api.support.fixture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import so.morton.api.storage.domain.chat.ParticipantEntity;
import so.morton.api.storage.domain.chat.ParticipantRepository;

@Component
public class ParticipantFactory {

    @Autowired private ParticipantRepository participantRepository;

    public ParticipantEntity create(Long chatId, Long memberId) {
        return participantRepository.save(ParticipantEntity.builder()
                .chatId(chatId)
                .memberId(memberId)
                .lastIdx(0L)
                .build());
    }
}
