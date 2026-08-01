package to.bconnect.api.storage.offer;

import org.springframework.data.jpa.repository.JpaRepository;

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

    List<OfferEntity> findAllByTaskIdAndStatusInOrderBySeqAsc(Long taskId, Collection<OfferStatus> statuses);

    List<OfferEntity> findAllByWorkerIdAndStatusOrderByIdDesc(Long workerId, OfferStatus status);

    List<OfferEntity> findAllByWorkerId(Long workerId);

    Optional<OfferEntity> findFirstByTaskIdOrderBySeqDesc(Long taskId);

    List<OfferEntity> findAllByStatusAndDueBefore(OfferStatus status, LocalDate due);
}
