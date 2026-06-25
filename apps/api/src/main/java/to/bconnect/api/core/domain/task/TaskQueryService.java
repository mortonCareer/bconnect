package to.bconnect.api.core.domain.task;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.storage.company.CompanyEntity;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.coworker.CoworkerRepository;
import to.bconnect.api.storage.offer.OfferRepository;
import to.bconnect.api.storage.project.ProjectRepository;
import to.bconnect.api.storage.task.TaskRepository;
import to.bconnect.api.storage.task.TaskType;
import to.bconnect.api.security.AuthUser;

import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskQueryService {

    private final TaskRepository taskRepository;
    private final CoworkerRepository coworkerRepository;
    private final CompanyRepository companyRepository;
    private final ProjectRepository projectRepository;
    private final OfferRepository offerRepository;

    @Transactional(readOnly = true)
    public Task get(AuthUser user, Long taskId) {
        val found = taskRepository.findById(taskId)
                .orElseThrow(() -> new CodeException(TaskExceptionCode.NOT_FOUND));

        if (found.getType() == TaskType.WORKER) {
            if (!found.getWorkerId().equals(user.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);
            return Task.of(found);
        }

        if (offerRepository.existsByTaskIdAndWorkerId(taskId, user.id()))
            return Task.of(found);

        val companyId = companyRepository.findByMemberId(user.id())
                .map(CompanyEntity::getId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.FORBIDDEN));

        val project = projectRepository.findById(found.getProjectId())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        if (!project.getCompanyId().equals(companyId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        return Task.of(found);
    }

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
