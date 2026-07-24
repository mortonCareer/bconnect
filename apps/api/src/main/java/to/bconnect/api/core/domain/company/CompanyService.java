package to.bconnect.api.core.domain.company;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.attachment.domain.AttachmentLinker;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.CursorPage;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.ReferenceType;
import to.bconnect.api.storage.company.CompanyEntity;
import to.bconnect.api.storage.company.CompanyRepository;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final AttachmentLinker attachmentLinker;

    @Transactional(readOnly = true)
    public CursorPage<Company> list(CursorLimit cursor) {
        val companies = companyRepository.findAllBy(
                cursor.toScrollPosition(),
                cursor.toLimit(),
                cursor.toSort()
        );

        return CursorPage.from(
                companies.map(Company::of),
                Company::id
        );
    }

    @Transactional(readOnly = true)
    public Company get(Long companyId) {
        val found = companyRepository.findById(companyId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        return Company.of(found);
    }

    @Transactional(readOnly = true)
    public Company get(AuthUser user) {
        val found = companyRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        return Company.of(found);
    }

    @Transactional
    public Long create(AuthUser user, CreateCompany command) {
        if (companyRepository.existsByMemberId(user.id()))
            throw new CodeException(CompanyExceptionCode.ALREADY_EXISTS);

        if (companyRepository.existsByBrn(command.brn()))
            throw new CodeException(CompanyExceptionCode.DUPLICATE_BRN);

        val created = new CompanyEntity(
                user.id(),
                command.name(),
                command.brn()
        );

        val companyId = companyRepository.save(created).getId();
        attachmentLinker.link(user.id(), ReferenceType.COMPANY, companyId, command.pictureId());
        return companyId;
    }

    @Transactional
    public void update(AuthUser user, Long pictureId) {
        val found = companyRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        attachmentLinker.link(user.id(), ReferenceType.COMPANY, found.getId(), pictureId);
    }

    @Transactional
    public void delete(AuthUser user) {
        val optional = companyRepository.findByMemberId(user.id());
        if (optional.isEmpty())
            return;
        val found = optional.get();

        attachmentLinker.unlink(ReferenceType.COMPANY, found.getId());
        companyRepository.delete(found);
    }
}
