package to.bconnect.api.core.domain.company;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.company.CompanyEntity;
import to.bconnect.api.storage.company.CompanyRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;

    @Transactional(readOnly = true)
    public List<Company> list() {
        return companyRepository.findAll()
                .stream()
                .map(Company::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public Company get(Long companyId) {
        val found = companyRepository.findById(companyId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        return Company.of(found);
    }

    @Transactional
    public Long create(AuthUser user, CreateCompany command) {
        if (companyRepository.existsByMemberId(user.id()))
            throw new CodeException(CompanyExceptionCode.ALREADY_EXISTS);

        if (companyRepository.existsByBrn(command.brn()))
            throw new CodeException(CompanyExceptionCode.ALREADY_EXISTS);

        val created = new CompanyEntity(
                user.id(),
                command.name(),
                command.brn(),
                command.picture()
        );

        return companyRepository.save(created).getId();
    }

    @Transactional
    public void update(AuthUser user, String picture) {
        val found = companyRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        found.update(picture);
    }

    @Transactional
    public void delete(AuthUser user) {
        companyRepository.findByMemberId(user.id())
                .ifPresent(companyRepository::delete);
    }
}
