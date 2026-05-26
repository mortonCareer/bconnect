package so.morton.api.support.fixture;

import so.morton.api.api.controller.v1.request.CreatePostRequest;
import so.morton.api.api.controller.v1.request.UpdatePostRequest;
import so.morton.api.domain.post.Post;
import so.morton.api.storage.domain.post.PostEntity;

import java.time.LocalDateTime;
import java.util.List;

public class PostFactory {

    public static final String IMAGE = "https://example.com/image.jpg";

    public static Post create(Long id, Long profileId, Long taskId) {
        return new Post(id, profileId, taskId, List.of(IMAGE), "content",
                LocalDateTime.MIN, LocalDateTime.MIN);
    }

    public static PostEntity createEntity(Long profileId, Long taskId) {
        return PostEntity.builder()
                .profileId(profileId)
                .taskId(taskId)
                .images(List.of(IMAGE))
                .content("content")
                .build();
    }

    public static CreatePostRequest createRequest() {
        return new CreatePostRequest(1L, List.of(IMAGE), "content");
    }

    public static UpdatePostRequest updateRequest() {
        return new UpdatePostRequest("updated content");
    }
}
