package to.bconnect.api.core.presentation.v1;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.core.presentation.v1.response.FeedResponse;
import to.bconnect.api.core.domain.attachment.AttachmentResolver;
import to.bconnect.api.core.domain.attachment.ImageSize;
import to.bconnect.api.core.domain.post.Post;
import to.bconnect.api.core.domain.post.PostService;
import to.bconnect.api.core.domain.MemberResolver;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.core.domain.profile.ProfileResolver;
import to.bconnect.api.common.response.ApiResponse;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
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

        val attachmentIds = new ArrayList<Long>(posts.stream()
                .flatMap(it -> it.attachmentIds().stream())
                .toList());
        profileMap.values().stream().map(Profile::pictureId).filter(Objects::nonNull).forEach(attachmentIds::add);
        val attachmentMap = attachmentResolver.resolveMap(attachmentIds);

        val response = posts.stream()
                .map(it -> {
                    val profile = profileMap.get(it.memberId());
                    return FeedResponse.of(
                            it,
                            memberMap.get(it.memberId()),
                            profile,
                            it.attachmentIds().stream()
                                    .map(attachmentMap::get).filter(Objects::nonNull)
                                    .map(att -> attachmentResolver.url(att, ImageSize.MEDIUM)).toList(),
                            profile == null ? null : attachmentResolver.url(attachmentMap.get(profile.pictureId()), ImageSize.SMALL));
                })
                .toList();
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    public ApiResponse<FeedResponse> get(@PathVariable Long id) {
        val post = postService.get(id);
        val member = memberResolver.find(post.memberId());
        val profile = profileResolver.resolveMap(List.of(post.memberId())).get(post.memberId());

        val attachmentIds = new ArrayList<Long>(post.attachmentIds());
        if (profile != null && profile.pictureId() != null)
            attachmentIds.add(profile.pictureId());
        val attachmentMap = attachmentResolver.resolveMap(attachmentIds);

        return ApiResponse.success(FeedResponse.of(
                post, member, profile,
                post.attachmentIds().stream()
                        .map(attachmentMap::get).filter(Objects::nonNull)
                        .map(att -> attachmentResolver.url(att, ImageSize.MEDIUM)).toList(),
                profile == null ? null : attachmentResolver.url(attachmentMap.get(profile.pictureId()), ImageSize.SMALL)));
    }
}
