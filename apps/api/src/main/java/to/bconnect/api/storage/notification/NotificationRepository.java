package to.bconnect.api.storage.notification;

import org.springframework.data.domain.Limit;
import org.springframework.data.domain.ScrollPosition;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Window;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<NotificationEntity, Long> {

    Window<NotificationEntity> findByMemberId(Long memberId, ScrollPosition position, Limit limit, Sort sort);

    long countByMemberIdAndReadIsFalse(Long memberId);

    @Modifying
    @Query("UPDATE NotificationEntity n SET n.read = true WHERE n.memberId = :memberId AND n.read = false")
    void markAllReadByMemberId(@Param("memberId") Long memberId);
}
