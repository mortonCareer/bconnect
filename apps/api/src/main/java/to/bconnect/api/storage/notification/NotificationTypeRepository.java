package to.bconnect.api.storage.notification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface NotificationTypeRepository extends JpaRepository<NotificationTypeEntity, Long> {

    Optional<NotificationTypeEntity> findByCode(String code);

    List<NotificationTypeEntity> findByCodeIn(Collection<String> codes);
}
