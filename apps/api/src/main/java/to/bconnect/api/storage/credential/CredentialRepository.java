package to.bconnect.api.storage.credential;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.AttachmentReferenceProvider;

import java.util.Collection;
import java.util.List;
import java.util.Set;

public interface CredentialRepository extends JpaRepository<CredentialEntity, Long>, AttachmentReferenceProvider {

    List<CredentialEntity> findByMemberId(Long memberId);

    @Override
    default AttachmentContext context() {
        return AttachmentContext.CREDENTIAL;
    }

    @Override
    @Query("SELECT c.attachmentId FROM CredentialEntity c WHERE c.attachmentId IN :attachmentIds")
    Set<Long> referencedIds(@Param("attachmentIds") Collection<Long> attachmentIds);
}
