package to.bconnect.api.storage.offer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OfferRepository extends JpaRepository<OfferEntity, Long> {

    boolean existsByTaskIdAndStatus(Long taskId, OfferStatus status);

    List<OfferEntity> findAllByTaskIdAndStatus(Long taskId, OfferStatus status);

    Optional<OfferEntity> findFirstByTaskIdAndStatusAndSeqGreaterThanOrderBySeqAsc(
            Long taskId, OfferStatus status, int seq);

    List<OfferEntity> findAllByTaskIdOrderBySeqAsc(Long taskId);

    List<OfferEntity> findAllByWorkerIdAndStatus(Long workerId, OfferStatus status);

    Optional<OfferEntity> findFirstByTaskIdOrderBySeqDesc(Long taskId);
}
