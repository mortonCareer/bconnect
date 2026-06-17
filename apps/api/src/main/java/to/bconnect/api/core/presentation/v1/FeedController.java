package to.bconnect.api.core.presentation.v1;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.core.presentation.v1.response.FeedResponse;
import to.bconnect.api.core.domain.post.Post;
import to.bconnect.api.core.domain.post.PostService;
import to.bconnect.api.core.domain.MemberResolver;
import to.bconnect.api.core.domain.profile.ProfileQueryService;
import to.bconnect.api.common.response.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/feeds")
@RequiredArgsConstructor
public class FeedController {

    private final PostService postService;
    private final MemberResolver memberResolver;
    private final ProfileQueryService profileQueryService;

    @GetMapping
    public ApiResponse<List<FeedResponse>> list() {
        val posts = postService.list();

        val memberIds = posts.stream().map(Post::memberId).distinct().toList();
        val memberMap = memberResolver.resolveMap(memberIds);
        val profileMap = profileQueryService.resolveMap(memberIds);

        val response = posts.stream()
                .map(it -> FeedResponse.of(
                        it,
                        memberMap.get(it.memberId()),
                        profileMap.get(it.memberId())))
                .toList();
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}")
    public ApiResponse<FeedResponse> get(@PathVariable Long id) {
        val post = postService.get(id);
        val member = memberResolver.find(post.memberId());
        val profile = profileQueryService.resolveMap(List.of(post.memberId())).get(post.memberId());
        return ApiResponse.success(FeedResponse.of(post, member, profile));
    }
}
