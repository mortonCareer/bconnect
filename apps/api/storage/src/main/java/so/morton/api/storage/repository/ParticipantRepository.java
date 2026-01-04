package so.morton.api.storage.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import so.morton.api.storage.entity.ParticipantEntity;

import java.util.List;
import java.util.Optional;

public interface ParticipantRepository extends JpaRepository<ParticipantEntity, Long> {

    List<ParticipantEntity> findByChatId(Long chatId);

    List<ParticipantEntity> findByUserId(Long userId);

    Optional<ParticipantEntity> findByChatIdAndUserId(Long chatId, Long userId);
}
