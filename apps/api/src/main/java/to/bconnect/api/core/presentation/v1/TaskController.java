package to.bconnect.api.core.presentation.v1;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import to.bconnect.api.attachment.domain.AttachmentKeyUtils;
import to.bconnect.api.attachment.domain.AttachmentUrlService;
import to.bconnect.api.attachment.domain.ImageSize;
import to.bconnect.api.attachment.domain.SignedCookieIssuer;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.core.domain.member.MemberResolver;
import to.bconnect.api.core.domain.offer.Offer;
import to.bconnect.api.core.domain.offer.OfferService;
import to.bconnect.api.core.domain.profile.ProfileResolver;
import to.bconnect.api.core.domain.project.ProjectFinder;
import to.bconnect.api.core.domain.project.ProjectService;
import to.bconnect.api.core.domain.task.Task;
import to.bconnect.api.core.domain.task.TaskQueryService;
import to.bconnect.api.core.domain.task.TaskService;
import to.bconnect.api.core.presentation.v1.request.*;
import to.bconnect.api.core.presentation.v1.response.OfferResponse;
import to.bconnect.api.core.presentation.v1.response.TaskResponse;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.ReferenceType;

import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/v1/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskQueryService taskQueryService;
    private final TaskService taskService;
    private final ProjectFinder projectFinder;
    private final ProjectService projectService;
    private final OfferService offerService;
    private final MemberResolver memberResolver;
    private final ProfileResolver profileResolver;
    private final AttachmentUrlService attachmentUrlService;
    private final SignedCookieIssuer signedCookieIssuer;

    @GetMapping
    public ApiResponse<List<TaskResponse>> list(@AuthenticationPrincipal AuthUser user) {
        val workerTasks = taskQueryService.list(user);
        val projectTasks = taskQueryService.listAssigned(user);
        
        val offers = offerService.listByWorker(user);
        val offerByTaskId = offers.stream().collect(Collectors.toMap(Offer::taskId, Function.identity()));
        val offerTasks = taskQueryService.listByIds(offerByTaskId.keySet());

        val projectIds = Stream.concat(projectTasks.stream(), offerTasks.stream())
                .map(Task::projectId).distinct().toList();
        val addressMap = projectFinder.addressMap(projectIds);
        val companyMap = projectFinder.companyMap(projectIds);

        val worker = workerTasks.stream().map(it -> TaskResponse.of(it, it.workerAddress())).toList();
        val assigned = projectTasks.stream()
                .map(it -> TaskResponse.of(it, addressMap.get(it.projectId()), companyMap.get(it.projectId()))).toList();
        val offered = offerTasks.stream()
                .map(it -> TaskResponse.of(it, addressMap.get(it.projectId()), companyMap.get(it.projectId()),
                        offerByTaskId.get(it.id()))).toList();

        val body = Stream.of(worker, assigned, offered)
                .flatMap(List::stream)
                .toList();
        return ApiResponse.success(body);
    }

    @GetMapping("/{id}/offers")
    public ApiResponse<List<OfferResponse>> listOffers(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id,
            HttpServletResponse response) {
        val offers = offerService.listByTask(user, id);
        val workerIds = offers.stream().map(Offer::workerId).distinct().toList();
        val memberMap = memberResolver.resolveMap(workerIds);
        val profileMap = profileResolver.resolveMap(workerIds);
        val urlMap = attachmentUrlService.map(ReferenceType.MEMBER, workerIds, ImageSize.SMALL);

        val body = offers.stream()
                .map(it -> {
                    val member = memberMap.get(it.workerId());
                    return OfferResponse.of(
                            it,
                            member,
                            profileMap.get(it.workerId()),
                            urlMap.get(member.id()));
                })
                .toList();

        val scope = AttachmentKeyUtils.scope(AttachmentContext.MEMBER);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(body);
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
