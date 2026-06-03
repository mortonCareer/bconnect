package to.bconnect.api.api.controller.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.api.controller.v1.request.CreateTaskRequest;
import to.bconnect.api.api.controller.v1.request.UpdateTaskRequest;
import to.bconnect.api.api.controller.v1.response.TaskResponse;
import to.bconnect.api.domain.task.Task;
import to.bconnect.api.domain.task.TaskService;
import to.bconnect.api.support.security.User;
import to.bconnect.api.common.response.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public ApiResponse<List<TaskResponse>> list(@AuthenticationPrincipal User user) {
        List<TaskResponse> tasks = taskService.getAll(user).stream()
                .map(TaskResponse::of)
                .toList();
        return ApiResponse.success(tasks);
    }

    @GetMapping("/{id}")
    public ApiResponse<TaskResponse> get(@PathVariable Long id) {
        Task task = taskService.get(id);
        return ApiResponse.success(TaskResponse.of(task));
    }

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal User user,
            @RequestBody @Valid CreateTaskRequest request) {
        Task task = taskService.create(user, request);
        return ApiResponse.success(task.id());
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> update(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody @Valid UpdateTaskRequest request) {
        taskService.update(user, id, request);
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        taskService.delete(user, id);
        return ApiResponse.success(null);
    }
}
