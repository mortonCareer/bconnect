package to.bconnect.api.storage.coworker;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CoworkerRequestRepository extends JpaRepository<CoworkerRequestEntity, Long> {

    Optional<CoworkerRequestEntity> findByFromIdAndToId(Long fromId, Long toId);

    boolean existsByFromIdAndToId(Long fromId, Long toId);

    List<CoworkerRequestEntity> findAllByToId(Long toId);

    List<CoworkerRequestEntity> findAllByFromId(Long fromId);

    List<CoworkerRequestEntity> findAllByToIdOrderByIdDesc(Long toId);

    List<CoworkerRequestEntity> findAllByFromIdOrderByIdDesc(Long fromId);
}
