package to.bconnect.api.core.domain.post;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.post.PostEntity;
import to.bconnect.api.storage.post.PostRepository;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;

    @Transactional
    public Post create(AuthUser user, CreatePost command) {

        PostEntity post = PostEntity.builder()
                .memberId(user.id())
                .taskId(command.taskId())
                .images(command.images())
                .content(command.content())
                .build();

        postRepository.save(post);
        return Post.of(post);
    }

    @Transactional
    public void update(AuthUser user, Long postId, String content) {

        PostEntity found = postRepository.findById(postId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getMemberId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.update(content);
    }

    @Transactional
    public void delete(AuthUser user, Long postId) {
        postRepository.findById(postId).ifPresent(found -> {
            if (!found.getMemberId().equals(user.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);

            postRepository.delete(found);
        });
    }
}
