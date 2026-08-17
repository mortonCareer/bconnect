package to.bconnect.api.storage.offer;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface OfferRepository extends JpaRepository<OfferEntity, Long> {

    void deleteByTaskIdIn(Collection<Long> taskIds);

    void deleteAllByTaskId(Long taskId);

    boolean existsByTaskIdAndStatus(Long taskId, OfferStatus status);

    long countByTaskIdAndStatus(Long taskId, OfferStatus status);

    List<OfferEntity> findAllByTaskIdAndStatus(Long taskId, OfferStatus status);

    Optional<OfferEntity> findFirstByTaskIdAndStatusAndSeqGreaterThanOrderBySeqAsc(
            Long taskId, OfferStatus status, int seq);

    Optional<OfferEntity> findFirstByTaskIdAndStatusOrderBySeqDesc(Long taskId, OfferStatus status);

    List<OfferEntity> findAllByTaskIdOrderBySeqAsc(Long taskId);

    List<OfferEntity> findAllByWorkerIdAndStatusInOrderByIdDesc(Long workerId, Collection<OfferStatus> statuses);

    List<OfferEntity> findAllByWorkerId(Long workerId);

    Optional<OfferEntity> findFirstByTaskIdOrderBySeqDesc(Long taskId);

    List<OfferEntity> findAllByStatusAndDueBefore(OfferStatus status, LocalDate due);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "DELETE FROM offers WHERE worker_id = :memberId", nativeQuery = true)
    int purgeByWorkerId(@Param("memberId") Long memberId);
}
