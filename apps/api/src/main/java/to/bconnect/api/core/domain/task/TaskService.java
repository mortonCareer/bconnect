package to.bconnect.api.core.domain.task;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.storage.company.CompanyRepository;
import to.bconnect.api.storage.offer.OfferRepository;
import to.bconnect.api.storage.post.PostEntity;
import to.bconnect.api.storage.post.PostRepository;
import to.bconnect.api.storage.project.ProjectRepository;
import to.bconnect.api.storage.task.TaskEntity;
import to.bconnect.api.storage.task.TaskRepository;
import to.bconnect.api.storage.task.TaskType;
import to.bconnect.api.security.AuthUser;

import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final CompanyRepository companyRepository;
    private final ProjectRepository projectRepository;
    private final OfferRepository offerRepository;
    private final PostRepository postRepository;

    @Transactional
    public Long createByWorker(AuthUser user, CreateWorkerTask command) {
        val created = new TaskEntity(
                TaskType.WORKER,
                command.trades(),
                command.start(),
                command.end(),
                user.id(),
                command.title(),
                command.memo(),
                command.company(),
                command.address(),
                null,
                null,
                null,
                null
        );

        return taskRepository.save(created).getId();
    }

    @Transactional
    public Long createByCompany(AuthUser user, CreateProjectTask command) {
        val companyId = companyRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND))
                .getId();

        val project = projectRepository.findById(command.projectId())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        if (!project.getCompanyId().equals(companyId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        val created = new TaskEntity(
                TaskType.PROJECT,
                command.trades(),
                command.start(),
                command.end(),
                null,
                null,
                null,
                null,
                null,
                command.projectId(),
                command.title(),
                command.requirement(),
                command.memo()
        );

        return taskRepository.save(created).getId();
    }

    @Transactional
    public void updateByWorker(AuthUser user, Long taskId, UpdateWorkerTask command) {
        val found = taskRepository.findById(taskId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (found.getType() != TaskType.WORKER || !found.getWorkerId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.update(command.trades(), command.start(), command.end(),
                command.title(), command.memo(), command.company(), command.address());
    }

    @Transactional
    public void updateByCompany(AuthUser user, Long taskId, UpdateProjectTask command) {
        val task = taskRepository.findById(taskId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (task.getType() != TaskType.PROJECT)
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        val companyId = companyRepository.findByMemberId(user.id())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND))
                .getId();

        val project = projectRepository.findById(task.getProjectId())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!project.getCompanyId().equals(companyId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        task.update(command.trades(), command.start(), command.end(),
                command.title(), command.requirement(), command.memo());
    }

    @Transactional
    public void updateByAssignee(AuthUser user, Long taskId, UpdateAssigneeTask command) {
        val found = taskRepository.findById(taskId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (found.getType() != TaskType.PROJECT || found.getWorkerId() == null)
            throw new CodeException(TaskExceptionCode.NOT_ASSIGNED);

        if (!user.id().equals(found.getWorkerId()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.update(command.title(), command.memo());
    }

    @Transactional
    public void delete(AuthUser user, Long taskId) {
        val optional = taskRepository.findById(taskId);
        if (optional.isEmpty())
            return;
        val task = optional.get();

        if (task.getType() == TaskType.WORKER) {
            if (!task.getWorkerId().equals(user.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);
        } else {
            val companyId = companyRepository.findByMemberId(user.id())
                    .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND))
                    .getId();

            val project = projectRepository.findById(task.getProjectId())
                    .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
            if (!project.getCompanyId().equals(companyId))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);
        }

        offerRepository.deleteByTaskId(task.getId());

        postRepository.findAllByTaskId(task.getId())
                .forEach(PostEntity::detachTask);

        taskRepository.delete(task);
    }
}
