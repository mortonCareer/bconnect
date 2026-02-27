package so.morton.api.storage.domain.coworker;

import org.springframework.data.jpa.repository.JpaRepository;
import so.morton.api.storage.value.CoworkerStatus;

import java.util.List;
import java.util.Optional;

public interface CoworkerRepository extends JpaRepository<CoworkerEntity, Long> {

    Optional<CoworkerEntity> findByPair(String pair);

    boolean existsByPairAndStatus(String pair, CoworkerStatus status);

    List<CoworkerEntity> findByFromIdAndStatus(Long fromId, CoworkerStatus status);

    List<CoworkerEntity> findByToIdAndStatus(Long toId, CoworkerStatus status);

}
