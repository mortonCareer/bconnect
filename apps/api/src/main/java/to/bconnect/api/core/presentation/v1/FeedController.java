package to.bconnect.api.core.presentation.v1;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.core.presentation.v1.response.FeedResponse;
import to.bconnect.api.core.domain.attachment.Attachment;
import to.bconnect.api.core.domain.attachment.AttachmentResolver;
import to.bconnect.api.core.domain.attachment.ImageSize;
import to.bconnect.api.core.domain.post.Post;
import to.bconnect.api.core.domain.post.PostService;
import to.bconnect.api.core.domain.MemberResolver;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.core.domain.profile.ProfileQueryService;
import to.bconnect.api.security.member.Member;
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
    private final ProfileQueryService profileQueryService;
    private final AttachmentResolver attachmentResolver;

    @GetMapping
    public ApiResponse<List<FeedResponse>> list() {
        List<Post> posts = postService.list();

        List<Long> memberIds = posts.stream().map(Post::memberId).distinct().toList();
        Map<Long, Member> memberMap = memberResolver.map(memberIds);
        Map<Long, Profile> profileMap = profileQueryService.summaries(memberIds);

        List<Long> attachmentIds = new ArrayList<>(posts.stream()
                .flatMap(it -> it.attachmentIds().stream())
                .toList());
        profileMap.values().stream().map(Profile::pictureId).filter(Objects::nonNull).forEach(attachmentIds::add);
        Map<Long, Attachment> attachmentMap = attachmentResolver.resolveMap(attachmentIds);

        List<FeedResponse> response = posts.stream()
                .map(it -> {
                    Profile profile = profileMap.get(it.memberId());
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
        Post post = postService.get(id);
        Member member = memberResolver.find(post.memberId());
        Profile profile = profileQueryService.summaries(List.of(post.memberId())).get(post.memberId());

        List<Long> attachmentIds = new ArrayList<>(post.attachmentIds());
        if (profile != null && profile.pictureId() != null)
            attachmentIds.add(profile.pictureId());
        Map<Long, Attachment> attachmentMap = attachmentResolver.resolveMap(attachmentIds);

        return ApiResponse.success(FeedResponse.of(
                post, member, profile,
                post.attachmentIds().stream()
                        .map(attachmentMap::get).filter(Objects::nonNull)
                        .map(att -> attachmentResolver.url(att, ImageSize.MEDIUM)).toList(),
                profile == null ? null : attachmentResolver.url(attachmentMap.get(profile.pictureId()), ImageSize.SMALL)));
    }
}
