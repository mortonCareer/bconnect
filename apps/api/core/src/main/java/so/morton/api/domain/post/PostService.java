package so.morton.api.domain.post;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import so.morton.api.api.controller.v1.request.CreatePostRequest;
import so.morton.api.api.controller.v1.request.UpdatePostRequest;
import so.morton.api.storage.domain.post.PostEntity;
import so.morton.api.storage.domain.post.PostRepository;
import so.morton.api.storage.value.EntityStatus;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final PostFinder postFinder;

    @Transactional
    public Post create(CreatePostRequest request) {
        PostEntity entity = PostEntity.builder()
                .authorId(request.authorId())
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
        return postRepository.findAllByStatus(EntityStatus.ACTIVE)
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
    public Post update(Long postId, UpdatePostRequest request) {
        PostEntity entity = postRepository.findById(postId)
                .filter(e -> e.getStatus() == EntityStatus.ACTIVE)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        entity.update(request.images(), request.content());

        return Post.of(entity);
    }

    @Transactional
    public void delete(Long postId) {
        PostEntity entity = postRepository.findById(postId)
                .filter(e -> e.getStatus() == EntityStatus.ACTIVE)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        entity.delete();
    }
}
