package to.bconnect.api.core.domain.project;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.domain.company.Company;
import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.company.CompanyEntity;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.project.ProjectEntity;
import to.bconnect.api.storage.project.ProjectRepository;

import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProjectFinder {

    private final ProjectRepository projectRepository;
    private final CompanyRepository companyRepository;

    @Transactional(readOnly = true)
    public Project get(Long projectId) {
        val found = projectRepository.findById(projectId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        return Project.of(found);
    }

    @Transactional(readOnly = true)
    public Map<Long, Address> addressMap(Collection<Long> projectIds) {
        return projectRepository.findAllById(projectIds).stream()
                .collect(Collectors.toMap(ProjectEntity::getId, ProjectEntity::getAddress));
    }

    @Transactional(readOnly = true)
    public Map<Long, Company> companyMap(Collection<Long> projectIds) {
        val projects = projectRepository.findAllById(projectIds);
        val companyIds = projects.stream().map(ProjectEntity::getCompanyId).distinct().toList();
        val companyById = companyRepository.findAllById(companyIds).stream()
                .collect(Collectors.toMap(CompanyEntity::getId, Company::of));

        return projects.stream()
                .filter(it -> companyById.containsKey(it.getCompanyId()))
                .collect(Collectors.toMap(ProjectEntity::getId, it -> companyById.get(it.getCompanyId())));
    }

    @Transactional(readOnly = true)
    public void validateOwnership(Long memberId, Long projectId) {
        if (!isOwner(memberId, projectId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
    }

    @Transactional(readOnly = true)
    public boolean isOwner(Long memberId, Long projectId) {
        val optional = companyRepository.findByMemberId(memberId);
        if (optional.isEmpty())
            return false;

        val project = projectRepository.findById(projectId);
        return project.isPresent() && project.get().getCompanyId().equals(optional.get().getId());
    }
}
