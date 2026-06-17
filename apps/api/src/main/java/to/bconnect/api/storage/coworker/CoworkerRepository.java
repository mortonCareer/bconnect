package to.bconnect.api.storage.coworker;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CoworkerRepository extends JpaRepository<CoworkerEntity, Long> {

    @Query("SELECT COUNT(c) > 0 FROM CoworkerEntity c "
            + "WHERE (c.minId = :memberId AND c.maxId = :coworkerId) "
            + "OR (c.minId = :coworkerId AND c.maxId = :memberId)")
    boolean existsByMembers(@Param("memberId") Long memberId, @Param("coworkerId") Long coworkerId);

    @Query("SELECT c FROM CoworkerEntity c "
            + "WHERE (c.minId = :memberId AND c.maxId = :coworkerId) "
            + "OR (c.minId = :coworkerId AND c.maxId = :memberId)")
    Optional<CoworkerEntity> findByMembers(@Param("memberId") Long memberId, @Param("coworkerId") Long coworkerId);

    @Query("SELECT c FROM CoworkerEntity c WHERE c.minId = :memberId OR c.maxId = :memberId")
    List<CoworkerEntity> findByMemberId(@Param("memberId") Long memberId);

    @Query("SELECT COUNT(c) FROM CoworkerEntity c WHERE c.minId = :memberId OR c.maxId = :memberId")
    long countByMemberId(@Param("memberId") Long memberId);

    @Query(value = "SELECT member_id, COUNT(*) FROM ("
            + "SELECT min_id AS member_id FROM coworkers WHERE min_id IN :memberIds "
            + "UNION ALL "
            + "SELECT max_id AS member_id FROM coworkers WHERE max_id IN :memberIds"
            + ") t GROUP BY member_id", nativeQuery = true)
    List<Object[]> countByMemberIdIn(@Param("memberIds") Collection<Long> memberIds);
}
