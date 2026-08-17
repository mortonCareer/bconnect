package to.bconnect.api.storage.retention;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

public interface TransactionPartyRepository extends JpaRepository<TransactionPartyEntity, Long> {

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM TransactionPartyEntity t WHERE t.expireAt < :threshold")
    int deleteByExpireAtBefore(@Param("threshold") Instant threshold);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "INSERT INTO transaction_parties (member_id, member_name, member_phone, counterparty_id, counterparty_name, counterparty_brn, matched_at, archived_at, expire_at) SELECT m.id, m.name, m.phone, c.id, c.name, c.brn, o.modified_at, :archivedAt, :expireAt FROM offers o JOIN tasks t ON t.id = o.task_id JOIN projects p ON p.id = t.project_id JOIN companies c ON c.id = p.company_id JOIN members m ON m.id = o.worker_id WHERE o.worker_id = :memberId AND o.status = 'ACCEPTED'", nativeQuery = true)
    int archiveByWorkerId(@Param("memberId") Long memberId, @Param("archivedAt") Instant archivedAt, @Param("expireAt") Instant expireAt);
}
