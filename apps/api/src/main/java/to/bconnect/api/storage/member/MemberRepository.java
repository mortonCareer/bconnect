package to.bconnect.api.storage.member;

import org.springframework.data.jpa.repository.JpaRepository;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.AttachmentReferenceProvider;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

public interface MemberRepository extends JpaRepository<MemberEntity, Long>, AttachmentReferenceProvider {

    Optional<MemberEntity> findByUsername(String username);

    boolean existsByUsername(String username);

    Optional<MemberEntity> findByPhone(String phone);

    List<MemberEntity> findByIdIn(Collection<Long> ids);

    List<MemberEntity> findByUsernameIn(Collection<String> usernames);

    List<MemberEntity> findByPictureIdIn(Collection<Long> pictureIds);

    @Override
    default AttachmentContext context() {
        return AttachmentContext.MEMBER;
    }

    @Override
    default Set<Long> referencedIds(Collection<Long> attachmentIds) {
        return findByPictureIdIn(attachmentIds).stream()
                .map(MemberEntity::getPictureId)
                .collect(Collectors.toSet());
    }
}
