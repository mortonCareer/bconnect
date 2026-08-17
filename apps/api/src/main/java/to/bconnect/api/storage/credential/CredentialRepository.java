package to.bconnect.api.storage.credential;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CredentialRepository extends JpaRepository<CredentialEntity, Long> {

    List<CredentialEntity> findAllByMemberId(Long memberId);

    List<CredentialEntity> findAllByMemberIdOrderByIdDesc(Long memberId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "DELETE FROM credentials WHERE member_id = :memberId", nativeQuery = true)
    int purgeByMemberId(@Param("memberId") Long memberId);
}
