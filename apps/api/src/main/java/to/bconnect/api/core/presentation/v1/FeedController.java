package to.bconnect.api.core.presentation.v1;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.core.presentation.v1.response.FeedResponse;
import to.bconnect.api.core.domain.post.Post;
import to.bconnect.api.core.domain.post.PostService;
import to.bconnect.api.core.domain.MemberResolver;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.common.response.ApiResponse;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/feeds")
@RequiredArgsConstructor
public class FeedController {

    private final PostService postService;
    private final MemberResolver memberResolver;

    @GetMapping
    public ApiResponse<List<FeedResponse>> list() {
        List<Post> posts = postService.list();

        List<Long> memberIds = posts.stream().map(Post::memberId).distinct().toList();
        Map<Long, Member> memberMap = memberResolver.map(memberIds);

        List<FeedResponse> feeds = posts.stream()
                .map(post -> FeedResponse.of(post, memberMap.get(post.memberId())))
                .toList();
        return ApiResponse.success(feeds);
    }

    @GetMapping("/{id}")
    public ApiResponse<FeedResponse> get(@PathVariable Long id) {
        Post post = postService.get(id);
        Member member = memberResolver.find(post.memberId());
        return ApiResponse.success(FeedResponse.of(post, member));
    }
}
