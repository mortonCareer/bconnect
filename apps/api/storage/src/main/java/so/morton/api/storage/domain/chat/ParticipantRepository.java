package so.morton.api.storage.domain.chat;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ParticipantRepository extends JpaRepository<ParticipantEntity, Long> {

    List<ParticipantEntity> findByChatId(Long chatId);

    List<ParticipantEntity> findByMemberId(Long memberId);

    Optional<ParticipantEntity> findByChatIdAndMemberId(Long chatId, Long memberId);
}
