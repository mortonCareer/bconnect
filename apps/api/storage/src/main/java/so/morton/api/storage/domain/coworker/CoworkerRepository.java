package so.morton.api.storage.domain.coworker;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CoworkerRepository extends JpaRepository<CoworkerEntity, Long> {

    Optional<CoworkerEntity> findByMinIdAndMaxId(Long minId, Long maxId);

    boolean existsByMinIdAndMaxId(Long minId, Long maxId);

    @Query("SELECT c FROM CoworkerEntity c WHERE c.minId = :profileId OR c.maxId = :profileId")
    List<CoworkerEntity> findByProfileId(@Param("profileId") Long profileId);
}
