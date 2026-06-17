package to.bconnect.api.core.domain.project;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.company.CompanyEntity;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.project.ProjectEntity;
import to.bconnect.api.storage.project.ProjectRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final CompanyRepository companyRepository;

    @Transactional(readOnly = true)
    public List<Project> list(AuthUser user) {
        CompanyEntity company = findCompany(user);

        return projectRepository.findAllByCompanyId(company.getId())
                .stream()
                .map(Project::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public Project get(Long projectId) {
        ProjectEntity found = projectRepository.findById(projectId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        return Project.of(found);
    }

    @Transactional
    public Long create(AuthUser user, CreateProject command) {
        CompanyEntity company = findCompany(user);

        ProjectEntity created = new ProjectEntity(
                company.getId(),
                command.title(),
                command.address()
        );

        return projectRepository.save(created).getId();
    }

    @Transactional
    public void update(AuthUser user, Long projectId, UpdateProject command) {
        ProjectEntity found = projectRepository.findById(projectId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        CompanyEntity company = findCompany(user);
        if (!found.getCompanyId().equals(company.getId()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.update(command.title(), command.address());
    }

    @Transactional
    public void delete(AuthUser user, Long projectId) {
        projectRepository.findById(projectId).ifPresent(it -> {
            CompanyEntity company = findCompany(user);
            if (!it.getCompanyId().equals(company.getId()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);

            projectRepository.delete(it);
        });
    }

    private CompanyEntity findCompany(AuthUser user) {
        return companyRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }
}
