package to.bconnect.api.core.presentation.v1;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.attachment.domain.AttachmentKeyUtils;
import to.bconnect.api.attachment.domain.AttachmentResolver;
import to.bconnect.api.attachment.domain.ImageSize;
import to.bconnect.api.attachment.domain.SignedCookieIssuer;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.core.domain.member.MemberResolver;
import to.bconnect.api.core.domain.post.Post;
import to.bconnect.api.core.domain.post.PostService;
import to.bconnect.api.core.domain.profile.ProfileResolver;
import to.bconnect.api.core.domain.project.ProjectService;
import to.bconnect.api.core.domain.task.Task;
import to.bconnect.api.core.domain.task.TaskQueryService;
import to.bconnect.api.core.presentation.v1.response.FeedResponse;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.ReferenceType;
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
    private final ProjectService projectService;
    private final MemberResolver memberResolver;
    private final ProfileResolver profileResolver;
    private final AttachmentResolver attachmentResolver;
    private final SignedCookieIssuer signedCookieIssuer;

    @GetMapping
    public ApiResponse<List<FeedResponse>> list(HttpServletResponse response) {
        val posts = postService.list();

        val memberIds = posts.stream().map(Post::memberId).distinct().toList();
        val memberMap = memberResolver.resolveMap(memberIds);
        val profileMap = profileResolver.resolveMap(memberIds);
        val pictureMap = attachmentResolver.resolveUrlMap(
                ReferenceType.MEMBER, memberIds, ImageSize.SMALL);

        val postIds = posts.stream().map(Post::id).toList();
        val attachmentMap = attachmentResolver.resolveListMap(ReferenceType.POST, postIds);

        val taskIds = posts.stream().map(Post::taskId).filter(Objects::nonNull).distinct().toList();
        val taskMap = taskQueryService.listByIds(taskIds).stream()
                .collect(Collectors.toMap(Task::id, Function.identity()));
        val projectIds = taskMap.values().stream()
                .filter(it -> it.type() == TaskType.PROJECT)
                .map(Task::projectId).distinct().toList();
        val addressMap = projectService.resolveAddressMap(projectIds);

        val body = posts.stream()
                .map(it -> {
                    val member = memberMap.get(it.memberId());
                    val task = it.taskId() == null ? null : taskMap.get(it.taskId());
                    val address = task == null ? null : task.type() == TaskType.WORKER
                            ? task.workerAddress()
                            : addressMap.get(task.projectId());
                    val attachments = attachmentMap.getOrDefault(it.id(), List.of());
                    val urlMap = attachmentResolver.parseUrlMap(attachments, ImageSize.MEDIUM);
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

        return ApiResponse.success(body);
    }

    @GetMapping("/{id}")
    public ApiResponse<FeedResponse> get(
            @PathVariable Long id,
            HttpServletResponse response) {
        val post = postService.get(id);
        val member = memberResolver.get(post.memberId());
        val profile = profileResolver.resolveMap(List.of(post.memberId())).get(post.memberId());
        val attachments = attachmentResolver.list(ReferenceType.POST, post.id());
        val urlMap = attachmentResolver.parseUrlMap(attachments, ImageSize.MEDIUM);
        val picture = attachmentResolver.getUrl(ReferenceType.MEMBER, member.id(), ImageSize.SMALL);

        val task = post.taskId() == null ? null
                : taskQueryService.listByIds(List.of(post.taskId())).stream().findFirst().orElse(null);
        val projectIds = task != null && task.type() == TaskType.PROJECT
                ? List.of(task.projectId())
                : List.<Long>of();
        val addressMap = projectService.resolveAddressMap(projectIds);
        val address = task == null ? null : task.type() == TaskType.WORKER
                ? task.workerAddress()
                : addressMap.get(task.projectId());

        val scope = AttachmentKeyUtils.scope(AttachmentContext.MEMBER);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(FeedResponse.of(post, member, profile, task, address, attachments, urlMap, picture));
    }
}
