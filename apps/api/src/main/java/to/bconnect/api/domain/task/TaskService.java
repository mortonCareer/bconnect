package to.bconnect.api.domain.task;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.api.controller.v1.request.CreateTaskRequest;
import to.bconnect.api.api.controller.v1.request.UpdateTaskRequest;
import to.bconnect.api.domain.coworker.CoworkerFinder;
import to.bconnect.api.domain.profile.Profile;
import to.bconnect.api.storage.domain.task.TaskEntity;
import to.bconnect.api.storage.domain.task.TaskRepository;
import to.bconnect.api.domain.profile.ProfileFinder;
import to.bconnect.api.support.security.User;

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
    public List<Task> list(User user) {
        Profile profile = profileFinder.findByMemberId(user.id());
        return taskFinder.findAllByProfileId(profile.id());
    }

    @Transactional(readOnly = true)
    public List<Task> listByCoworker(User user, Long targetId) {
        Profile profile = profileFinder.findByMemberId(user.id());
        if (!coworkerFinder.isCoworker(profile.id(), targetId))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
        return taskFinder.findAllByProfileId(targetId);
    }

    @Transactional
    public Task create(User user, CreateTaskRequest request) {
        Profile profile = profileFinder.findByMemberId(user.id());
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
    public void update(User user, Long taskId, UpdateTaskRequest request) {
        Profile profile = profileFinder.findByMemberId(user.id());
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
    public void delete(User user, Long taskId) {
        Profile profile = profileFinder.findByMemberId(user.id());
        taskRepository.findById(taskId).ifPresent(found -> {
            if (!found.getProfileId().equals(profile.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);
            taskRepository.delete(found);
        });
    }
}
