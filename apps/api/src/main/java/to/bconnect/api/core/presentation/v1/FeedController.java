package to.bconnect.api.core.presentation.v1;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.core.presentation.v1.response.FeedResponse;
import to.bconnect.api.attachment.AttachmentResolver;
import to.bconnect.api.attachment.ImageSize;
import to.bconnect.api.core.domain.post.Post;
import to.bconnect.api.core.domain.post.PostService;
import to.bconnect.api.core.domain.MemberResolver;
import to.bconnect.api.core.domain.profile.ProfileResolver;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.common.response.ApiResponse;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/v1/feeds")
@RequiredArgsConstructor
public class FeedController {

    private final PostService postService;
    private final MemberResolver memberResolver;
    private final ProfileResolver profileResolver;
    private final AttachmentResolver attachmentResolver;

    @GetMapping
    public ApiResponse<List<FeedResponse>> list() {
        val posts = postService.list();

        val memberIds = posts.stream().map(Post::memberId).distinct().toList();
        val memberMap = memberResolver.resolveMap(memberIds);
        val profileMap = profileResolver.resolveMap(memberIds);
        val pictureMap = attachmentResolver.resolveUrlMap(
                memberMap.values().stream().map(Member::pictureId).toList(), ImageSize.SMALL);

        val attachmentIds = posts.stream()
                .flatMap(it -> it.attachmentIds().stream())
                .toList();
        val attachmentMap = attachmentResolver.resolveMap(attachmentIds);

        val response = posts.stream()
                .map(it -> {
                    val member = memberMap.get(it.memberId());
                    return FeedResponse.of(
                            it,
                            member,
                            profileMap.get(it.memberId()),
                            it.attachmentIds().stream()
                                    .map(attachmentMap::get).filter(Objects::nonNull)
                                    .map(att -> attachmentResolver.getUrl(att, ImageSize.MEDIUM)).toList(),
                            pictureMap.get(member.pictureId()));
                })
                .toList();
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    public ApiResponse<FeedResponse> get(@PathVariable Long id) {
        val post = postService.get(id);
        val member = memberResolver.find(post.memberId());
        val profile = profileResolver.resolveMap(List.of(post.memberId())).get(post.memberId());

        val attachmentMap = attachmentResolver.resolveMap(post.attachmentIds());

        return ApiResponse.success(FeedResponse.of(
                post, member, profile,
                post.attachmentIds().stream()
                        .map(attachmentMap::get).filter(Objects::nonNull)
                        .map(att -> attachmentResolver.getUrl(att, ImageSize.MEDIUM)).toList(),
                attachmentResolver.getUrl(member.pictureId(), ImageSize.SMALL)));
    }
}
