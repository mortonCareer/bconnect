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
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.core.domain.project.ProjectService;
import to.bconnect.api.core.domain.task.TaskService;
import to.bconnect.api.core.presentation.v1.request.CreateProjectRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateProjectRequest;
import to.bconnect.api.core.presentation.v1.response.ProjectTaskResponse;
import to.bconnect.api.core.presentation.v1.response.ProjectResponse;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.Address;

import java.util.List;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final TaskService taskService;

    @GetMapping
    public ApiResponse<List<ProjectResponse>> list(@AuthenticationPrincipal AuthUser user) {
        List<ProjectResponse> response = projectService.list(user).stream()
                .map(ProjectResponse::of)
                .toList();
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    public ApiResponse<ProjectResponse> get(@PathVariable Long id) {
        return ApiResponse.success(ProjectResponse.of(projectService.get(id)));
    }

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid CreateProjectRequest request) {
        Long id = projectService.create(user, request.toCommand());
        return ApiResponse.success(id);
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> update(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id,
            @RequestBody @Valid UpdateProjectRequest request) {
        projectService.update(user, id, request.toCommand());
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        projectService.delete(user, id);
        return ApiResponse.success(null);
    }
}
