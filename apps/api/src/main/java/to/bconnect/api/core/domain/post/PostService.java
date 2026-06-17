package to.bconnect.api.core.domain.post;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.post.PostEntity;
import to.bconnect.api.storage.post.PostRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;

    @Transactional(readOnly = true)
    public List<Post> list() {
        return postRepository.findAll()
                .stream()
                .map(Post::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public Post get(Long postId) {
        return postRepository.findById(postId)
                .map(Post::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    @Transactional
    public Long create(AuthUser user, CreatePost command) {
        val created = new PostEntity(
                user.id(),
                command.taskId(),
                command.images(),
                command.content()
        );

        return postRepository.save(created).getId();
    }

    @Transactional
    public void update(AuthUser user, Long postId, String content) {

        val found = postRepository.findById(postId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getMemberId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.update(content);
    }

    @Transactional
    public void delete(AuthUser user, Long postId) {
        postRepository.findById(postId).ifPresent(it -> {
            if (!it.getMemberId().equals(user.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);

            postRepository.delete(it);
        });
    }
}
