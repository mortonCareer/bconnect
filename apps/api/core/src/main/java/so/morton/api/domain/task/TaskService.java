package so.morton.api.domain.task;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import so.morton.api.api.controller.v1.request.CreateTaskRequest;
import so.morton.api.api.controller.v1.request.UpdateTaskRequest;
import so.morton.api.domain.profile.Profile;
import so.morton.api.storage.domain.task.TaskEntity;
import so.morton.api.storage.domain.task.TaskRepository;
import so.morton.api.domain.profile.ProfileFinder;
import so.morton.api.support.auth.User;

import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;

import java.util.List;
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskFinder taskFinder;
    private final ProfileFinder profileFinder;

    @Transactional(readOnly = true)
    public Task get(Long taskId) {
        return taskFinder.find(taskId);
    }

    @Transactional(readOnly = true)
    public List<Task> getAll() {
        return taskFinder.findAll();
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
                .startDate(request.startDate())
                .endDate(request.endDate())
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
                request.startDate(),
                request.endDate()
        );
    }

    @Transactional
    public void delete(User user, Long taskId) {
        Profile profile = profileFinder.findByMemberId(user.id());
        TaskEntity found = taskRepository.findById(taskId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getProfileId().equals(profile.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
        taskRepository.delete(found);
    }
}
