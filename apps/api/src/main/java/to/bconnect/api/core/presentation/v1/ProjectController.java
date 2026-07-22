package to.bconnect.api.core.presentation.v1;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import to.bconnect.api.attachment.domain.AttachmentKeyUtils;
import to.bconnect.api.attachment.domain.AttachmentResolver;
import to.bconnect.api.attachment.domain.ImageSize;
import to.bconnect.api.attachment.domain.SignedCookieIssuer;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.core.domain.board.NoteService;
import to.bconnect.api.core.domain.member.MemberResolver;
import to.bconnect.api.core.domain.project.ProjectService;
import to.bconnect.api.core.domain.task.TaskQueryService;
import to.bconnect.api.core.presentation.v1.request.CreateProjectRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateProjectRequest;
import to.bconnect.api.core.presentation.v1.response.MemberSummaryResponse;
import to.bconnect.api.core.presentation.v1.response.NoteResponse;
import to.bconnect.api.core.presentation.v1.response.ProjectResponse;
import to.bconnect.api.core.presentation.v1.response.TaskResponse;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.ReferenceType;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final TaskQueryService taskQueryService;
    private final NoteService noteService;
    private final MemberResolver memberResolver;
    private final AttachmentResolver attachmentResolver;
    private final SignedCookieIssuer signedCookieIssuer;

    @GetMapping
    public ApiResponse<List<ProjectResponse>> list(@AuthenticationPrincipal AuthUser user) {
        val body = projectService.list(user).stream()
                .map(ProjectResponse::of)
                .toList();
        return ApiResponse.success(body);
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
        val body = tasks.stream()
                .map(it -> TaskResponse.of(it, address))
                .toList();
        return ApiResponse.success(body);
    }

    @GetMapping("/{id}/assignees")
    public ApiResponse<List<MemberSummaryResponse>> listAssignees(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id,
            HttpServletResponse response) {
        val assigneeIds = taskQueryService.listAssigneeIdsByProject(user, id);
        val memberMap = memberResolver.resolveMap(assigneeIds);
        val urlMap = attachmentResolver.resolveUrlMap(ReferenceType.MEMBER, assigneeIds, ImageSize.SMALL);

        val body = assigneeIds.stream()
                .map(memberMap::get)
                .filter(Objects::nonNull)
                .map(it -> MemberSummaryResponse.of(it, urlMap.get(it.id())))
                .toList();

        val scope = AttachmentKeyUtils.scope(AttachmentContext.MEMBER);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(body);
    }

    @GetMapping("/{id}/notes")
    public ApiResponse<List<NoteResponse>> listNotes(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        val body = noteService.listByProject(user, id).stream()
                .map(NoteResponse::of)
                .toList();
        return ApiResponse.success(body);
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
