package to.bconnect.api.core.domain.company;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.project.ProjectRepository;
import to.bconnect.api.storage.task.TaskRepository;

@Component
@RequiredArgsConstructor
public class CompanyFinder {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final CompanyRepository companyRepository;

    @Transactional(readOnly = true)
    public Company getByTaskId(Long taskId) {
        val task = taskRepository.findById(taskId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        val project = projectRepository.findById(task.getProjectId())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        val company = companyRepository.findById(project.getCompanyId())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        return Company.of(company);
    }
}
