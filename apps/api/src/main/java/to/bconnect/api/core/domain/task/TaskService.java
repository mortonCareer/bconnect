package to.bconnect.api.core.domain.task;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.core.presentation.v1.request.CreateTaskRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateTaskRequest;
import to.bconnect.api.core.domain.coworker.CoworkerFinder;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.core.storage.task.TaskEntity;
import to.bconnect.api.core.storage.task.TaskRepository;
import to.bconnect.api.core.domain.profile.ProfileFinder;
import to.bconnect.api.security.AuthUser;

import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;

import java.util.List;
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskFinder taskFinder;
    private final ProfileFinder profileFinder;
    private final CoworkerFinder coworkerFinder;

    @Transactional(readOnly = true)
    public List<Task> list(AuthUser authUser) {
        Profile profile = profileFinder.findByMemberId(authUser.id());
        return taskRepository.findAllByProfileId(profile.id())
                .stream()
                .map(Task::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Task> listByCoworker(AuthUser authUser, Long targetId) {
        Profile profile = profileFinder.findByMemberId(authUser.id());
        if (!coworkerFinder.isCoworker(profile.id(), targetId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        return taskRepository.findAllByProfileId(profile.id())
                .stream()
                .map(Task::of)
                .toList();
    }

    @Transactional
    public Task create(AuthUser authUser, CreateTaskRequest request) {
        Profile profile = profileFinder.findByMemberId(authUser.id());
        TaskEntity task = TaskEntity.builder()
                .profileId(profile.id())
                .company(request.company())
                .address(request.address())
                .taskTitle(request.taskTitle())
                .eventTitle(request.eventTitle())
                .trades(request.trades())
                .start(request.start())
                .end(request.end())
                .build();

        taskRepository.save(task);
        return Task.of(task);
    }

    @Transactional
    public void update(AuthUser authUser, Long taskId, UpdateTaskRequest request) {
        Profile profile = profileFinder.findByMemberId(authUser.id());
        TaskEntity found = taskRepository.findById(taskId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getProfileId().equals(profile.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.update(
                request.company(),
                request.address(),
                request.taskTitle(),
                request.eventTitle(),
                request.trades(),
                request.start(),
                request.end()
        );
    }

    @Transactional
    public void delete(AuthUser authUser, Long taskId) {
        Profile profile = profileFinder.findByMemberId(authUser.id());
        taskRepository.findById(taskId).ifPresent(found -> {
            if (!found.getProfileId().equals(profile.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);
            taskRepository.delete(found);
        });
    }
}
