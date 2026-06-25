package to.bconnect.api.storage.profile;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.AttachmentReferenceProvider;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface ProfileRepository extends JpaRepository<ProfileEntity, Long>, AttachmentReferenceProvider {

    Optional<ProfileEntity> findByMemberId(Long memberId);

    List<ProfileEntity> findByIdIn(Collection<Long> ids);

    List<ProfileEntity> findByMemberIdIn(Collection<Long> memberIds);

    boolean existsByMemberId(Long memberId);

    @Override
    default AttachmentContext context() {
        return AttachmentContext.PROFILE;
    }

    @Override
    @Query("SELECT p.pictureId FROM ProfileEntity p WHERE p.pictureId IN :attachmentIds")
    Set<Long> referencedIds(@Param("attachmentIds") Collection<Long> attachmentIds);
}
