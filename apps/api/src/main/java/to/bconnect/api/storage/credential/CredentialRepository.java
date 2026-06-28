package to.bconnect.api.storage.credential;

import org.springframework.data.jpa.repository.JpaRepository;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.AttachmentReferenceProvider;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public interface CredentialRepository extends JpaRepository<CredentialEntity, Long>, AttachmentReferenceProvider {

    List<CredentialEntity> findByMemberId(Long memberId);

    List<CredentialEntity> findByAttachmentIdIn(Collection<Long> attachmentIds);

    @Override
    default AttachmentContext context() {
        return AttachmentContext.CREDENTIAL;
    }

    @Override
    default Set<Long> referencedIds(Collection<Long> attachmentIds) {
        return findByAttachmentIdIn(attachmentIds).stream()
                .map(CredentialEntity::getAttachmentId)
                .collect(Collectors.toSet());
    }
}
