package to.bconnect.api.core.domain.post;

import lombok.RequiredArgsConstructor;
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
                .map(this::toPost)
                .toList();
    }

    @Transactional
    public Post create(AuthUser user, CreatePost command) {
        PostEntity post = PostEntity.builder()
                .memberId(user.id())
                .taskId(command.taskId())
                .images(command.images())
                .content(command.content())
                .build();

        postRepository.save(post);
        return toPost(post);
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

    private Post toPost(PostEntity entity) {
        return new Post(
                entity.getId(),
                entity.getMemberId(),
                entity.getTaskId(),
                entity.getImages(),
                entity.getContent(),
                entity.getCreatedAt(),
                entity.getModifiedAt()
        );
    }
}
