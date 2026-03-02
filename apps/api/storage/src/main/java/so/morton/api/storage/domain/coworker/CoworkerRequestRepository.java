package so.morton.api.storage.domain.coworker;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CoworkerRequestRepository extends JpaRepository<CoworkerRequestEntity, Long> {

    Optional<CoworkerRequestEntity> findByFromIdAndToId(Long fromId, Long toId);

    @Query("SELECT r FROM CoworkerRequestEntity r WHERE r.fromId = :profileId OR r.toId = :profileId")
    List<CoworkerRequestEntity> findByProfileId(@Param("profileId") Long profileId);
}
