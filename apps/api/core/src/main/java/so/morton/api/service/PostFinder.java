package so.morton.api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import so.morton.api.domain.Post;
import so.morton.api.storage.repository.PostRepository;
import so.morton.api.storage.value.EntityStatus;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;

import java.util.List;

@Component
@RequiredArgsConstructor
public class PostFinder {

    private final PostRepository postRepository;

    public Post find(Long postId) {
        return postRepository.findById(postId)
                .filter(e -> e.getStatus() == EntityStatus.ACTIVE)
                .map(Post::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    public List<Post> findByAuthor(Long authorId) {
        return postRepository.findByAuthorId(authorId)
                .stream()
                .filter(e -> e.getStatus() == EntityStatus.ACTIVE)
                .map(Post::of)
                .toList();
    }

    public List<Post> findByTask(Long taskId) {
        return postRepository.findByTaskId(taskId)
                .stream()
                .filter(e -> e.getStatus() == EntityStatus.ACTIVE)
                .map(Post::of)
                .toList();
    }
}
