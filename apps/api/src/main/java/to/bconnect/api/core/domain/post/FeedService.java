package to.bconnect.api.core.domain.post;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.storage.post.PostRepository;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.security.member.MemberFinder;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FeedService {

    private final PostRepository postRepository;
    private final MemberFinder memberFinder;

    @Transactional(readOnly = true)
    public List<Feed> list() {
        List<Post> posts =  postRepository.findAll()
                .stream()
                .map(Post::of)
                .toList();

        List<Long> memberIds = posts.stream().map(Post::memberId).toList();
        Map<Long, Member> memberMap = memberFinder.resolveMap(memberIds);

        return posts.stream()
                .map(post -> new Feed(
                        memberMap.get(post.memberId()),
                        post
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public Feed get(Long postId) {
        Post post = postRepository.findById(postId)
                .map(Post::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        Member member = memberFinder.find(post.memberId());
        return new Feed(member, post);
    }

}
