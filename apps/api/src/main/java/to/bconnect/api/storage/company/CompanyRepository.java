package to.bconnect.api.storage.company;

import org.springframework.data.jpa.repository.JpaRepository;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.AttachmentReferenceProvider;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

public interface CompanyRepository extends JpaRepository<CompanyEntity, Long>, AttachmentReferenceProvider {

    Optional<CompanyEntity> findByMemberId(Long memberId);

    List<CompanyEntity> findByPictureIdIn(Collection<Long> pictureIds);

    boolean existsByMemberId(Long memberId);

    boolean existsByBrn(String brn);

    @Override
    default AttachmentContext context() {
        return AttachmentContext.COMPANY;
    }

    @Override
    default Set<Long> referencedIds(Collection<Long> attachmentIds) {
        return findByPictureIdIn(attachmentIds).stream()
                .map(CompanyEntity::getPictureId)
                .collect(Collectors.toSet());
    }
}
