package to.bconnect.api.support.fixture;

import to.bconnect.api.core.presentation.v1.request.CreatePostRequest;
import to.bconnect.api.core.presentation.v1.request.UpdatePostRequest;
import to.bconnect.api.core.domain.post.Post;
import to.bconnect.api.storage.post.PostEntity;

import java.util.List;

import static to.bconnect.api.support.fixture.FixtureConstant.DEFAULT_ATTACHMENT_ID;
import static to.bconnect.api.support.fixture.FixtureConstant.MIN_DATE_TIME;

public class PostFactory {

    public static Post create(Long id, Long memberId, Long taskId) {
        return new Post(id, memberId, taskId, List.of(DEFAULT_ATTACHMENT_ID), "content",
                MIN_DATE_TIME, MIN_DATE_TIME);
    }

    public static PostEntity createEntity(Long memberId, Long taskId) {
        return new PostEntity(memberId, taskId, "content");
    }

    public static CreatePostRequest createRequest() {
        return new CreatePostRequest(1L, List.of(DEFAULT_ATTACHMENT_ID), "content");
    }

    public static UpdatePostRequest updateRequest() {
        return new UpdatePostRequest("updated content");
    }
}
