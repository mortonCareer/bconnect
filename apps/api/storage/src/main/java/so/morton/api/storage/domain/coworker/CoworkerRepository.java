package so.morton.api.storage.domain.coworker;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import so.morton.api.storage.value.CoworkerStatus;

import java.util.List;
import java.util.Optional;

public interface CoworkerRepository extends JpaRepository<CoworkerEntity, Long> {

    Optional<CoworkerEntity> findByPair(String pair);

    @Query("SELECT c FROM CoworkerEntity c WHERE c.fromId = :profileId OR c.toId = :profileId")
    List<CoworkerEntity> findByProfileId(@Param("profileId") Long profileId);

    @Query("SELECT c FROM CoworkerEntity c " +
           "WHERE (c.fromId = :profileId OR c.toId = :profileId) " +
           "AND c.status = :status")
    List<CoworkerEntity> findByProfileIdAndStatus(Long profileId, CoworkerStatus status);

    boolean existsByPairAndStatus(String pair, CoworkerStatus status);
}
