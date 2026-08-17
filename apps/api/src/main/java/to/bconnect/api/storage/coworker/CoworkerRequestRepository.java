package to.bconnect.api.storage.coworker;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CoworkerRequestRepository extends JpaRepository<CoworkerRequestEntity, Long> {

    Optional<CoworkerRequestEntity> findByFromIdAndToId(Long fromId, Long toId);

    boolean existsByFromIdAndToId(Long fromId, Long toId);

    List<CoworkerRequestEntity> findAllByToId(Long toId);

    List<CoworkerRequestEntity> findAllByFromId(Long fromId);

    List<CoworkerRequestEntity> findAllByToIdOrderByIdDesc(Long toId);

    List<CoworkerRequestEntity> findAllByFromIdOrderByIdDesc(Long fromId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "DELETE FROM coworker_requests WHERE from_id = :memberId OR to_id = :memberId", nativeQuery = true)
    int purgeByMemberId(@Param("memberId") Long memberId);
}
