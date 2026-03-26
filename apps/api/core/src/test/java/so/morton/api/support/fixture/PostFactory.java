package so.morton.api.support.fixture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import so.morton.api.storage.domain.post.PostEntity;
import so.morton.api.storage.domain.post.PostRepository;

import java.util.List;

@Component
public class PostFactory {

    @Autowired private PostRepository postRepository;

    public PostEntity create(Long authorId, Long taskId) {
        return postRepository.save(PostEntity.builder()
                .authorId(authorId)
                .taskId(taskId)
                .images(List.of("image"))
                .content("content")
                .build());
    }
}
