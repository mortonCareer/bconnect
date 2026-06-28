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
import to.bconnect.api.core.presentation.v1.response.OfferResponse;
import to.bconnect.api.core.presentation.v1.response.TaskResponse;
import to.bconnect.api.attachment.AttachmentResolver;
import to.bconnect.api.attachment.ImageSize;
import to.bconnect.api.core.domain.MemberResolver;
import to.bconnect.api.core.domain.offer.Offer;
import to.bconnect.api.core.domain.offer.OfferService;
import to.bconnect.api.core.domain.profile.ProfileResolver;
import to.bconnect.api.core.domain.project.ProjectService;
import to.bconnect.api.core.domain.task.Task;
import to.bconnect.api.core.domain.task.TaskService;
import to.bconnect.api.core.domain.task.TaskQueryService;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.common.response.ApiResponse;

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
    private final ProjectService projectService;
    private final OfferService offerService;
    private final MemberResolver memberResolver;
    private final ProfileResolver profileResolver;
    private final AttachmentResolver attachmentResolver;

    @GetMapping
    public ApiResponse<List<TaskResponse>> list(@AuthenticationPrincipal AuthUser user) {
        val worker = taskQueryService.list(user).stream()
                .map(it -> TaskResponse.of(it, it.address()));

        val projectTasks = taskQueryService.listAssigned(user);
        val assignedAddressMap = projectService.resolveAddressMap(
                projectTasks.stream().map(Task::projectId).distinct().toList());
        val assigned = projectTasks.stream()
                .map(it -> TaskResponse.of(it, assignedAddressMap.get(it.projectId())));

        val offers = offerService.listByWorker(user);
        val offerByTaskId = offers.stream()
                .collect(Collectors.toMap(Offer::taskId, Function.identity()));
        val offerTasks = taskQueryService.listByIds(offerByTaskId.keySet());
        val offerAddressMap = projectService.resolveAddressMap(
                offerTasks.stream().map(Task::projectId).distinct().toList());
        val offered = offerTasks.stream()
                .map(it -> TaskResponse.of(it, offerAddressMap.get(it.projectId()), offerByTaskId.get(it.id())));

        val response = Stream.concat(Stream.concat(worker, assigned), offered).toList();
        return ApiResponse.success(response);
    }

    @GetMapping("/{taskId}/offers")
    public ApiResponse<List<OfferResponse>> listOffers(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long taskId) {
        val offers = offerService.listByTask(user, taskId);

        val workerIds = offers.stream().map(Offer::workerId).distinct().toList();
        val memberMap = memberResolver.resolveMap(workerIds);
        val profileMap = profileResolver.resolveMap(workerIds);
        val urlMap = attachmentResolver.resolveUrlMap(
                memberMap.values().stream().map(Member::pictureId).toList(), ImageSize.SMALL);

        val response = offers.stream()
                .map(it -> {
                    val member = memberMap.get(it.workerId());
                    return OfferResponse.of(
                            it,
                            member,
                            profileMap.get(it.workerId()),
                            urlMap.get(member.pictureId()));
                })
                .toList();
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
