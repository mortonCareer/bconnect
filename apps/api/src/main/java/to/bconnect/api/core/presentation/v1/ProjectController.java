package to.bconnect.api.core.presentation.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.core.domain.board.NoteService;
import to.bconnect.api.core.domain.project.ProjectService;
import to.bconnect.api.core.domain.task.TaskQueryService;
import to.bconnect.api.core.presentation.v1.request.CreateProjectRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateProjectRequest;
import to.bconnect.api.core.presentation.v1.response.NoteResponse;
import to.bconnect.api.core.presentation.v1.response.ProjectResponse;
import to.bconnect.api.core.presentation.v1.response.TaskResponse;
import to.bconnect.api.security.AuthUser;

import java.util.List;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final TaskQueryService taskQueryService;
    private final NoteService noteService;

    @GetMapping
    public ApiResponse<List<ProjectResponse>> list(@AuthenticationPrincipal AuthUser user) {
        val response = projectService.list(user).stream()
                .map(ProjectResponse::of)
                .toList();
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    public ApiResponse<ProjectResponse> get(@PathVariable Long id) {
        return ApiResponse.success(ProjectResponse.of(projectService.get(id)));
    }

    @GetMapping("/{id}/tasks")
    public ApiResponse<List<TaskResponse>> listTasks(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        val tasks = taskQueryService.listByProject(user, id);
        val address = projectService.get(id).address();
        val response = tasks.stream()
                .map(it -> TaskResponse.of(it, address))
                .toList();
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}/notes")
    public ApiResponse<List<NoteResponse>> listNotes(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        val response = noteService.listByProject(user, id).stream()
                .map(NoteResponse::of)
                .toList();
        return ApiResponse.success(response);
    }

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid CreateProjectRequest request) {
        val id = projectService.create(user, request.toCommand());
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
