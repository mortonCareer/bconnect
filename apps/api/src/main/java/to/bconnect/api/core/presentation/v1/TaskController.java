package to.bconnect.api.core.presentation.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.core.presentation.v1.request.CreateProjectTaskRequest;
import to.bconnect.api.core.presentation.v1.request.CreateWorkerTaskRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateAssigneeTaskRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateProjectTaskRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateWorkerTaskRequest;
import to.bconnect.api.core.presentation.v1.response.TaskResponse;
import to.bconnect.api.core.domain.project.ProjectService;
import to.bconnect.api.core.domain.task.Task;
import to.bconnect.api.core.domain.task.TaskService;
import to.bconnect.api.core.domain.task.TaskQueryService;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.common.response.ApiResponse;

import java.util.List;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskQueryService taskQueryService;
    private final TaskService taskService;
    private final ProjectService projectService;

    @GetMapping
    public ApiResponse<List<TaskResponse>> list(@AuthenticationPrincipal AuthUser user) {
        val worker = taskQueryService.list(user).stream()
                .map(it -> TaskResponse.of(it, it.address()));

        val projectTasks = taskQueryService.listAssigned(user);
        val addressMap = projectService.resolveAddressMap(
                projectTasks.stream().map(Task::projectId).distinct().toList());
        val assigned = projectTasks.stream()
                .map(it -> TaskResponse.of(it, addressMap.get(it.projectId())));

        val response = Stream.concat(worker, assigned).toList();
        return ApiResponse.success(response);
    }

    @PostMapping("/worker")
    public ApiResponse<Long> createByWorker(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid CreateWorkerTaskRequest request) {
        val id = taskService.createByWorker(user, request.toCommand());
        return ApiResponse.success(id);
    }

    @PostMapping("/company")
    public ApiResponse<Long> createByCompany(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid CreateProjectTaskRequest request) {
        val id = taskService.createByCompany(user, request.toCommand());
        return ApiResponse.success(id);
    }

    @PutMapping("/{id}/worker")
    public ApiResponse<Void> updateByWorker(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id,
            @RequestBody @Valid UpdateWorkerTaskRequest request) {
        taskService.updateByWorker(user, id, request.toCommand());
        return ApiResponse.success(null);
    }

    @PutMapping("/{id}/company")
    public ApiResponse<Void> updateByCompany(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id,
            @RequestBody @Valid UpdateProjectTaskRequest request) {
        taskService.updateByCompany(user, id, request.toCommand());
        return ApiResponse.success(null);
    }

    @PutMapping("/{id}/assignee")
    public ApiResponse<Void> updateByAssignee(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id,
            @RequestBody @Valid UpdateAssigneeTaskRequest request) {
        taskService.updateByAssignee(user, id, request.toCommand());
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        taskService.delete(user, id);
        return ApiResponse.success(null);
    }
}
