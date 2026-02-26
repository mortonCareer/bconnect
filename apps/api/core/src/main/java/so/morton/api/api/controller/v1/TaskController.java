package so.morton.api.api.controller.v1;

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
import so.morton.api.api.controller.v1.request.CreateTaskRequest;
import so.morton.api.api.controller.v1.request.UpdateTaskRequest;
import so.morton.api.api.controller.v1.response.TaskResponse;
import so.morton.api.domain.task.Task;
import so.morton.api.domain.task.TaskService;
import so.morton.api.support.auth.User;
import so.morton.api.support.response.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public ApiResponse<TaskResponse> create(
            @AuthenticationPrincipal User user,
            @RequestBody @Valid CreateTaskRequest request) {
        Task task = taskService.create(user.id(), request);
        return ApiResponse.success(TaskResponse.of(task));
    }

    @GetMapping
    public ApiResponse<List<TaskResponse>> getAll() {
        List<TaskResponse> tasks = taskService.getAll().stream()
                .map(TaskResponse::of)
                .toList();
        return ApiResponse.success(tasks);
    }

    @GetMapping("/{id}")
    public ApiResponse<TaskResponse> get(@PathVariable Long id) {
        Task task = taskService.get(id);
        return ApiResponse.success(TaskResponse.of(task));
    }

    @PutMapping("/{id}")
    public ApiResponse<TaskResponse> update(
            @PathVariable Long id,
            @AuthenticationPrincipal User user,
            @RequestBody @Valid UpdateTaskRequest request) {
        Task task = taskService.update(id, user.id(), request);
        return ApiResponse.success(TaskResponse.of(task));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        taskService.delete(id, user.id());
        return ApiResponse.success(null);
    }
}
