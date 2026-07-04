package to.bconnect.api.storage.chat;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Collection;

public interface ParticipantRepository extends JpaRepository<ParticipantEntity, Long> {

    List<ParticipantEntity> findAllByMemberId(Long memberId);

    List<ParticipantEntity> findAllByChatIdIn(Collection<Long> chatIds);

    List<ParticipantEntity> findAllByChatIdAndMemberIdIn(Long chatId, Collection<Long> memberIds);

    boolean existsByChatIdAndMemberId(Long chatId, Long memberId);
}
