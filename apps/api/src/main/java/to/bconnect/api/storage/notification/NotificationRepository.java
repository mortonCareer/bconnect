package to.bconnect.api.storage.notification;

import org.springframework.data.domain.Limit;
import org.springframework.data.domain.ScrollPosition;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Window;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {

    Window<NotificationEntity> findByReceiverId(Long receiverId, ScrollPosition position, Limit limit, Sort sort);

    long countByReceiverIdAndReadAtIsNull(Long receiverId);

    @Modifying
    @Query("UPDATE NotificationEntity n SET n.readAt = :now WHERE n.receiverId = :receiverId AND n.readAt IS NULL")
    int markAllReadByReceiverId(@Param("receiverId") Long receiverId, @Param("now") Instant now);
}
