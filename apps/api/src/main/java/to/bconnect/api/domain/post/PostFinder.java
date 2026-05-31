package to.bconnect.api.domain.post;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import to.bconnect.api.storage.domain.post.PostRepository;

import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;

import java.util.List;

@Component
@RequiredArgsConstructor
public class PostFinder {

    private final PostRepository postRepository;

    public Post find(Long postId) {
        return postRepository.findById(postId)
                .map(Post::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    public List<Post> findByProfileId(Long profileId) {
        return postRepository.findByProfileId(profileId)
                .stream()
                .map(Post::of)
                .toList();
    }

    public List<Post> findAll() {
        return postRepository.findAll()
                .stream()
                .map(Post::of)
                .toList();
    }

    public List<Post> findByTaskId(Long taskId) {
        return postRepository.findByTaskId(taskId)
                .stream()
                .map(Post::of)
                .toList();
    }
}
