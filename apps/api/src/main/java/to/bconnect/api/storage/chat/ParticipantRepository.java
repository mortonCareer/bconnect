package to.bconnect.api.storage.chat;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Collection;

public interface ParticipantRepository extends JpaRepository<ParticipantEntity, Long> {

    List<ParticipantEntity> findByMemberId(Long memberId);

    List<ParticipantEntity> findByChatIdIn(Collection<Long> chatIds);

    List<ParticipantEntity> findByChatIdAndMemberIdIn(Long chatId, Collection<Long> memberIds);

    boolean existsByChatIdAndMemberId(Long chatId, Long memberId);
}
