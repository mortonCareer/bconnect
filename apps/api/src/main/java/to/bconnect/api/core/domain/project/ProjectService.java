package to.bconnect.api.core.domain.project;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.domain.task.TaskManager;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.company.CompanyEntity;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.project.ProjectEntity;
import to.bconnect.api.storage.project.ProjectRepository;
import to.bconnect.api.storage.task.TaskEntity;
import to.bconnect.api.storage.task.TaskRepository;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final CompanyRepository companyRepository;
    private final TaskRepository taskRepository;
    private final TaskManager taskManager;

    @Transactional(readOnly = true)
    public List<Project> list(AuthUser user) {
        val company = findCompany(user);

        return projectRepository.findAllByCompanyId(company.getId())
                .stream()
                .map(Project::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public Project get(Long projectId) {
        val found = projectRepository.findById(projectId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        return Project.of(found);
    }

    @Transactional(readOnly = true)
    public Map<Long, Address> resolveAddressMap(Collection<Long> projectIds) {
        return projectRepository.findAllById(projectIds).stream()
                .collect(Collectors.toMap(ProjectEntity::getId, ProjectEntity::getAddress));
    }

    @Transactional
    public Long create(AuthUser user, CreateProject command) {
        val company = findCompany(user);

        val created = new ProjectEntity(
                company.getId(),
                command.title(),
                command.address()
        );

        val projectId = projectRepository.save(created).getId();

        return projectId;
    }

    @Transactional
    public void update(AuthUser user, Long projectId, UpdateProject command) {
        val found = projectRepository.findById(projectId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        val company = findCompany(user);
        if (!found.getCompanyId().equals(company.getId()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.update(command.title(), command.address());
    }

    @Transactional
    public void delete(AuthUser user, Long projectId) {
        val optional = projectRepository.findById(projectId);
        if (optional.isEmpty())
            return;
        val found = optional.get();

        val company = findCompany(user);
        if (!found.getCompanyId().equals(company.getId()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        val taskIds = taskRepository.findAllByProjectId(found.getId()).stream()
                .map(TaskEntity::getId)
                .toList();
        taskManager.deleteByIds(taskIds);

        projectRepository.delete(found);
    }

    private CompanyEntity findCompany(AuthUser user) {
        return companyRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }
}
