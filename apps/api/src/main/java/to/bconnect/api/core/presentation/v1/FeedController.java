package to.bconnect.api.core.presentation.v1;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.web.bind.annotation.*;
import to.bconnect.api.core.presentation.v1.response.FeedResponse;
import to.bconnect.api.attachment.AttachmentResolver;
import to.bconnect.api.attachment.ImageSize;
import to.bconnect.api.core.domain.post.Post;
import to.bconnect.api.core.domain.post.PostService;
import to.bconnect.api.core.domain.member.MemberResolver;
import to.bconnect.api.core.domain.profile.ProfileResolver;
import to.bconnect.api.storage.attachment.ReferenceType;
import to.bconnect.api.common.response.ApiResponse;

import java.util.List;

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
                ReferenceType.MEMBER, memberIds, ImageSize.SMALL);

        val postIds = posts.stream().map(Post::id).toList();
        val imageMap = attachmentResolver.resolveUrlListMap(ReferenceType.POST, postIds, ImageSize.MEDIUM);

        val response = posts.stream()
                .map(it -> {
                    val member = memberMap.get(it.memberId());
                    return FeedResponse.of(
                            it,
                            member,
                            profileMap.get(it.memberId()),
                            imageMap.getOrDefault(it.id(), List.of()),
                            pictureMap.get(member.id()));
                })
                .toList();
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    public ApiResponse<FeedResponse> get(@PathVariable Long id) {
        val post = postService.get(id);
        val member = memberResolver.find(post.memberId());
        val profile = profileResolver.resolveMap(List.of(post.memberId())).get(post.memberId());
        val images = attachmentResolver.listUrl(ReferenceType.POST, post.id(), ImageSize.MEDIUM);
        val picture = attachmentResolver.getUrl(ReferenceType.MEMBER, member.id(), ImageSize.SMALL);
        return ApiResponse.success(FeedResponse.of(post, member, profile, images, picture));
    }
}
