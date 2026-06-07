package to.bconnect.api.core.storage.coworker;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CoworkerRequestRepository extends JpaRepository<CoworkerRequestEntity, Long> {

    Optional<CoworkerRequestEntity> findByFromIdAndToId(Long fromId, Long toId);

    List<CoworkerRequestEntity> findByToId(Long toId);

    List<CoworkerRequestEntity> findByFromId(Long fromId);
}
