package to.bconnect.api.core.storage.chat;

import org.springframework.data.jpa.repository.JpaRepository;


public interface ChatRepository extends JpaRepository<ChatEntity, Long> {
}
