package so.morton.api.storage.domain.chat;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.Collection;

public interface ParticipantRepository extends JpaRepository<ParticipantEntity, Long> {

    List<ParticipantEntity> findByMemberId(Long memberId);

    List<ParticipantEntity> findByChatIdIn(Collection<Long> chatIds);
}
