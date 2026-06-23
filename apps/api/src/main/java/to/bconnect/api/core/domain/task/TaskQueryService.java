package to.bconnect.api.core.domain.task;

import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.storage.company.CompanyEntity;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.coworker.CoworkerRepository;
import to.bconnect.api.storage.project.ProjectRepository;
import to.bconnect.api.storage.task.TaskRepository;
import to.bconnect.api.storage.task.TaskType;
import to.bconnect.api.security.AuthUser;

import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskQueryService {

    private final TaskRepository taskRepository;
    private final CoworkerRepository coworkerRepository;
    private final CompanyRepository companyRepository;
    private final ProjectRepository projectRepository;

    @Transactional(readOnly = true)
    public List<Task> list(AuthUser user) {
        return taskRepository.findAllByWorkerIdAndType(user.id(), TaskType.WORKER)
                .stream()
                .map(Task::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Task> listAssigned(AuthUser user) {
        return taskRepository.findAllByWorkerIdAndType(user.id(), TaskType.PROJECT)
                .stream()
                .map(Task::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Task> listByCoworker(AuthUser user, Long targetId) {
        if (!coworkerRepository.existsByMembers(user.id(), targetId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        return taskRepository.findAllByWorkerId(targetId)
                .stream()
                .map(Task::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Task> listByProject(AuthUser user, Long projectId) {
        val companyId = companyRepository.findByMemberId(user.id())
                .map(CompanyEntity::getId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        val project = projectRepository.findById(projectId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        if (!project.getCompanyId().equals(companyId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        return taskRepository.findAllByProjectId(projectId)
                .stream()
                .map(Task::of)
                .toList();
    }
}
