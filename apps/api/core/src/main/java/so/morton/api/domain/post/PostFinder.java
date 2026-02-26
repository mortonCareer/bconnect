package so.morton.api.domain.post;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import so.morton.api.storage.domain.post.PostRepository;

import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;

import java.util.List;

@Component
@RequiredArgsConstructor
public class PostFinder {

    private final PostRepository postRepository;

    public Post find(Long postId) {
        return postRepository.findById(postId)
                .filter(e -> !e.isDeleted())
                .map(Post::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    public List<Post> findByAuthorId(Long authorId) {
        return postRepository.findByAuthorId(authorId)
                .stream()
                .filter(e -> !e.isDeleted())
                .map(Post::of)
                .toList();
    }

    public List<Post> findByTask(Long taskId) {
        return postRepository.findByTaskId(taskId)
                .stream()
                .filter(e -> !e.isDeleted())
                .map(Post::of)
                .toList();
    }
}
