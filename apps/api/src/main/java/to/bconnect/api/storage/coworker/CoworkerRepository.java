package to.bconnect.api.storage.coworker;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CoworkerRepository extends JpaRepository<CoworkerEntity, Long> {

    Optional<CoworkerEntity> findByMinIdAndMaxId(Long minId, Long maxId);

    boolean existsByMinIdAndMaxId(Long minId, Long maxId);

    @Query("SELECT c FROM CoworkerEntity c WHERE c.minId = :memberId OR c.maxId = :memberId")
    List<CoworkerEntity> findByMemberId(@Param("memberId") Long memberId);

    @Query("SELECT COUNT(c) FROM CoworkerEntity c WHERE c.minId = :memberId OR c.maxId = :memberId")
    long countByMemberId(@Param("memberId") Long memberId);
}
