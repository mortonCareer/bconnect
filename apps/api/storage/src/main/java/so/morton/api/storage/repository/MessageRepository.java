package so.morton.api.storage.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import so.morton.api.storage.entity.MessageEntity;
import so.morton.api.storage.value.EntityStatus;

import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<MessageEntity, Long> {

    List<MessageEntity> findByChatId(Long chatId);

    Optional<MessageEntity> findTopByChatIdOrderByIdDesc(Long chatId);

    long countByChatIdAndIdGreaterThan(Long chatId, Long lastIdx);
}
