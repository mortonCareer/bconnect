package so.morton.api.storage.domain.chat;

import org.springframework.data.jpa.repository.JpaRepository;
import so.morton.api.storage.value.EntityStatus;

import java.util.List;

public interface ChatRepository extends JpaRepository<ChatEntity, Long> {

    List<ChatEntity> findAllByStatus(EntityStatus status);
}
