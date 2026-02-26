package so.morton.api.domain.post;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import so.morton.api.api.controller.v1.request.CreatePostRequest;
import so.morton.api.api.controller.v1.request.UpdatePostRequest;
import so.morton.api.storage.domain.post.PostEntity;
import so.morton.api.storage.domain.post.PostRepository;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final PostFinder postFinder;

    @Transactional
    public Post create(Long authorId, CreatePostRequest request) {
        PostEntity entity = PostEntity.builder()
                .authorId(authorId)
                .taskId(request.taskId())
                .images(request.images())
                .content(request.content())
                .build();

        PostEntity saved = postRepository.save(entity);
        return Post.of(saved);
    }

    @Transactional(readOnly = true)
    public Post get(Long postId) {
        return postFinder.find(postId);
    }

    @Transactional(readOnly = true)
    public List<Post> getAll() {
        return postRepository.findAllByDeletedFalse()
                .stream()
                .map(Post::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Post> getByAuthor(Long authorId) {
        return postFinder.findByAuthor(authorId);
    }

    @Transactional(readOnly = true)
    public List<Post> getByTask(Long taskId) {
        return postFinder.findByTask(taskId);
    }

    @Transactional
    public Post update(Long postId, Long userId, UpdatePostRequest request) {
        PostEntity entity = postRepository.findById(postId)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!entity.getAuthorId().equals(userId)) {
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
        }

        entity.update(request.images(), request.content());

        return Post.of(entity);
    }

    @Transactional
    public void delete(Long postId, Long userId) {
        PostEntity entity = postRepository.findById(postId)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!entity.getAuthorId().equals(userId)) {
            throw new CodeException(CommonExceptionCode.FORBIDDEN);
        }

        entity.delete();
    }
}
