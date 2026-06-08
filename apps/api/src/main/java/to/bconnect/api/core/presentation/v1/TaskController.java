package to.bconnect.api.core.presentation.v1;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.core.presentation.v1.request.CreateTaskRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateTaskRequest;
import to.bconnect.api.core.presentation.v1.response.CoworkerTaskResponse;
import to.bconnect.api.core.presentation.v1.response.TaskResponse;
import to.bconnect.api.core.domain.task.Task;
import to.bconnect.api.core.domain.task.TaskService;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.common.response.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public ApiResponse<List<TaskResponse>> list(@AuthenticationPrincipal AuthUser authUser) {
        List<TaskResponse> tasks = taskService.list(authUser).stream()
                .map(TaskResponse::of)
                .toList();
        return ApiResponse.success(tasks);
    }

    @GetMapping("/coworker")
    public ApiResponse<List<CoworkerTaskResponse>> listByCoworker(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestParam Long profileId) {
        List<CoworkerTaskResponse> tasks = taskService.listByCoworker(authUser, profileId).stream()
                .map(CoworkerTaskResponse::of)
                .toList();
        return ApiResponse.success(tasks);
    }

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestBody @Valid CreateTaskRequest request) {
        Task task = taskService.create(authUser, request);
        return ApiResponse.success(task.id());
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> update(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable Long id,
            @RequestBody @Valid UpdateTaskRequest request) {
        taskService.update(authUser, id, request);
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable Long id) {
        taskService.delete(authUser, id);
        return ApiResponse.success(null);
    }
}
