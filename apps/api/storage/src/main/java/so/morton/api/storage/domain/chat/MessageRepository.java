package so.morton.api.storage.domain.chat;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MessageRepository extends JpaRepository<MessageEntity, Long> {

    List<MessageEntity> findByChatId(Long chatId);

    Optional<MessageEntity> findTopByChatIdOrderByIdDesc(Long chatId);

    long countByChatIdAndIdGreaterThan(Long chatId, Long lastIdx);
}
