package to.bconnect.api.core.presentation.v1;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.attachment.domain.*;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.common.response.CursorPage;
import to.bconnect.api.core.domain.member.MemberResolver;
import to.bconnect.api.core.domain.post.Post;
import to.bconnect.api.core.domain.post.PostService;
import to.bconnect.api.core.domain.profile.ProfileResolver;
import to.bconnect.api.core.domain.project.ProjectFinder;
import to.bconnect.api.core.domain.project.ProjectService;
import to.bconnect.api.core.domain.task.Task;
import to.bconnect.api.core.domain.task.TaskQueryService;
import to.bconnect.api.core.presentation.v1.response.FeedResponse;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.AttachmentReferenceType;
import to.bconnect.api.storage.attachment.AttachmentType;
import to.bconnect.api.storage.task.TaskType;

import java.util.List;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/feeds")
@RequiredArgsConstructor
public class FeedController {

    private final PostService postService;
    private final TaskQueryService taskQueryService;
    private final ProjectFinder projectFinder;
    private final ProjectService projectService;
    private final MemberResolver memberResolver;
    private final ProfileResolver profileResolver;
    private final AttachmentFinder attachmentFinder;
    private final AttachmentUrlService attachmentUrlService;
    private final SignedCookieIssuer signedCookieIssuer;

    @GetMapping
    public ApiResponse<CursorPage<FeedResponse>> list(
            CursorLimit cursorLimit,
            HttpServletResponse response) {
        val page = postService.list(cursorLimit);
        val posts = page.content();

        val memberIds = posts.stream().map(Post::memberId).distinct().toList();
        val memberMap = memberResolver.resolveMapOrWithdrawn(memberIds);
        val profileMap = profileResolver.resolveMapOrWithdrawn(memberIds);
        val pictureMap = attachmentUrlService.map(
                AttachmentReferenceType.MEMBER, memberIds, ImageSize.SMALL);

        val postIds = posts.stream().map(Post::id).toList();
        val attachmentMap = attachmentFinder.listMap(AttachmentReferenceType.POST, postIds, AttachmentType.IMAGE);

        val taskIds = posts.stream().map(Post::taskId).filter(Objects::nonNull).distinct().toList();
        val taskMap = taskQueryService.listByIds(taskIds).stream()
                .collect(Collectors.toMap(Task::id, Function.identity()));
        val projectIds = taskMap.values().stream()
                .filter(it -> it.type() == TaskType.PROJECT)
                .map(Task::projectId).distinct().toList();
        val addressMap = projectFinder.addressMap(projectIds);

        val content = posts.stream()
                .map(it -> {
                    val member = memberMap.get(it.memberId());
                    val task = it.taskId() == null ? null : taskMap.get(it.taskId());
                    val address = task == null ? null : task.type() == TaskType.WORKER
                            ? task.workerAddress()
                            : addressMap.get(task.projectId());
                    val attachments = attachmentMap.getOrDefault(it.id(), List.of());
                    val urlMap = attachmentUrlService.parseUrlMap(attachments, ImageSize.MEDIUM);
                    return FeedResponse.of(
                            it,
                            member,
                            profileMap.get(it.memberId()),
                            task,
                            address,
                            attachments,
                            urlMap,
                            pictureMap.get(member.id()));
                })
                .toList();

        val scope = AttachmentKeyUtils.scope(AttachmentContext.MEMBER);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(new CursorPage<>(content, page.hasNext(), page.nextCursor()));
    }

    @GetMapping("/{id}")
    public ApiResponse<FeedResponse> get(
            @PathVariable Long id,
            HttpServletResponse response) {
        val post = postService.get(id);
        val member = memberResolver.getOrWithdrawn(post.memberId());
        val profile = profileResolver.getOrWithdrawn(post.memberId());
        val attachments = attachmentFinder.list(AttachmentReferenceType.POST, post.id(), AttachmentType.IMAGE);
        val urlMap = attachmentUrlService.parseUrlMap(attachments, ImageSize.MEDIUM);
        val picture = attachmentUrlService.get(AttachmentReferenceType.MEMBER, member.id(), ImageSize.SMALL);

        val task = post.taskId() == null ? null
                : taskQueryService.listByIds(List.of(post.taskId())).stream().findFirst().orElse(null);
        val projectIds = task != null && task.type() == TaskType.PROJECT
                ? List.of(task.projectId())
                : List.<Long>of();
        val addressMap = projectFinder.addressMap(projectIds);
        val address = task == null ? null : task.type() == TaskType.WORKER
                ? task.workerAddress()
                : addressMap.get(task.projectId());

        val scope = AttachmentKeyUtils.scope(AttachmentContext.MEMBER);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(FeedResponse.of(post, member, profile, task, address, attachments, urlMap, picture));
    }
}
