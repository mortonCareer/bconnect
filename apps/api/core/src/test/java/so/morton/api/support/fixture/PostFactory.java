package so.morton.api.support.fixture;

import so.morton.api.api.controller.v1.request.CreatePostRequest;
import so.morton.api.api.controller.v1.request.UpdatePostRequest;
import so.morton.api.domain.post.Post;
import so.morton.api.storage.domain.post.PostEntity;

import java.time.LocalDateTime;
import java.util.List;

public class PostFactory {

    public static Post create(Long id, Long authorId, Long taskId) {
        return new Post(id, authorId, taskId, List.of("image"), "content",
                LocalDateTime.MIN, LocalDateTime.MIN);
    }

    public static PostEntity createEntity(Long authorId, Long taskId) {
        return PostEntity.builder()
                .authorId(authorId)
                .taskId(taskId)
                .images(List.of("image"))
                .content("content")
                .build();
    }

    public static CreatePostRequest createRequest() {
        return new CreatePostRequest(1L, List.of("image"), "content");
    }

    public static UpdatePostRequest updateRequest() {
        return new UpdatePostRequest("updated content");
    }
}
