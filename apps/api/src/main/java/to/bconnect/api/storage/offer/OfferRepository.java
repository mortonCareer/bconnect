package to.bconnect.api.storage.offer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OfferRepository extends JpaRepository<OfferEntity, Long> {

    boolean existsByTaskIdAndWorkerId(Long taskId, Long workerId);

    List<OfferEntity> findAllByTaskId(Long taskId);
}
