package to.bconnect.api.storage.retention;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface TransactionPartyRepository extends JpaRepository<TransactionPartyEntity, Long> {

    List<TransactionPartyEntity> findAllByOfferIdIn(Collection<Long> offerIds);

    List<TransactionPartyEntity> findAllByMemberIdAndWithdrawnAtIsNull(Long memberId);

    List<TransactionPartyEntity> findAllByCounterpartyMemberIdAndCounterpartyWithdrawnAtIsNull(Long memberId);

    List<TransactionPartyEntity> findAllByMemberId(Long memberId);

    List<TransactionPartyEntity> findAllByCounterpartyMemberId(Long memberId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM TransactionPartyEntity t WHERE t.expireAt <= :threshold")
    int deleteExpired(@Param("threshold") Instant threshold);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE TransactionPartyEntity t
               SET t.counterpartyId = null,
                   t.counterpartyMemberId = null,
                   t.counterpartyName = null,
                   t.counterpartyPhone = null,
                   t.counterpartyBrn = null,
                   t.counterpartyWithdrawnAt = null,
                   t.counterpartyExpireAt = null
             WHERE t.counterpartyExpireAt <= :threshold
            """)
    int anonymizeExpiredCounterparties(@Param("threshold") Instant threshold);
}
