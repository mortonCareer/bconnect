package to.bconnect.api.storage.profile;

import org.springframework.data.jpa.repository.JpaRepository;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.AttachmentReferenceProvider;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

public interface ProfileRepository extends JpaRepository<ProfileEntity, Long>, AttachmentReferenceProvider {

    Optional<ProfileEntity> findByMemberId(Long memberId);

    List<ProfileEntity> findByIdIn(Collection<Long> ids);

    List<ProfileEntity> findByMemberIdIn(Collection<Long> memberIds);

    List<ProfileEntity> findByPictureIdIn(Collection<Long> pictureIds);

    boolean existsByMemberId(Long memberId);

    @Override
    default AttachmentContext context() {
        return AttachmentContext.PROFILE;
    }

    @Override
    default Set<Long> referencedIds(Collection<Long> attachmentIds) {
        return findByPictureIdIn(attachmentIds).stream()
                .map(ProfileEntity::getPictureId)
                .collect(Collectors.toSet());
    }
}
