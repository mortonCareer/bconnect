package to.bconnect.api.support.fixture;

import to.bconnect.api.api.controller.v1.request.CreatePostRequest;
import to.bconnect.api.api.controller.v1.request.UpdatePostRequest;
import to.bconnect.api.domain.post.Post;
import to.bconnect.api.storage.domain.post.PostEntity;

import java.time.LocalDateTime;
import java.util.List;

public class PostFactory {

    public static final String IMAGE = "https://placehold.co/600x400";

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
