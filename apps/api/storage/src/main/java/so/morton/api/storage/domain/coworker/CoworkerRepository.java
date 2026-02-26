package so.morton.api.storage.domain.coworker;

import org.springframework.data.jpa.repository.JpaRepository;
import so.morton.api.storage.value.CoworkerStatus;

import java.util.List;
import java.util.Optional;

public interface CoworkerRepository extends JpaRepository<CoworkerEntity, Long> {

    List<CoworkerEntity> findByFromIdAndStatusAndDeletedFalse(Long fromId, CoworkerStatus status);

    List<CoworkerEntity> findByToIdAndStatusAndDeletedFalse(Long toId, CoworkerStatus status);

    Optional<CoworkerEntity> findByPairAndDeletedFalse(String pair);
}
