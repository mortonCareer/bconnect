package to.bconnect.api.core.domain.post;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.domain.MemberResolver;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.storage.post.PostEntity;
import to.bconnect.api.storage.post.PostRepository;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FeedService {

    private final PostRepository postRepository;
    private final MemberResolver memberResolver;

    @Transactional(readOnly = true)
    public List<Feed> list() {
        List<PostEntity> posts =  postRepository.findAll();
        List<Long> memberIds = posts.stream().map(PostEntity::getMemberId).toList();
        Map<Long, Member> memberMap = memberResolver.map(memberIds);

        return posts.stream()
                .map(post -> toFeed(post, memberMap.get(post.getMemberId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public Feed get(Long postId) {
        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        Member member = memberResolver.find(post.getMemberId());
        return toFeed(post, member);
    }

    private Feed toFeed(PostEntity entity, Member member) {
        return new Feed(
                entity.getId(),
                member,
                entity.getTaskId(),
                entity.getImages(),
                entity.getContent(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
