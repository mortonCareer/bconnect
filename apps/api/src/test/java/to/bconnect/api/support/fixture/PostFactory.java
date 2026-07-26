package to.bconnect.api.support.fixture;

import to.bconnect.api.core.domain.post.CreatePost;
import to.bconnect.api.core.domain.post.Post;
import to.bconnect.api.core.domain.post.UpdatePost;
import to.bconnect.api.storage.post.PostEntity;

import java.util.List;

import static to.bconnect.api.support.fixture.FixtureConstant.DEFAULT_ATTACHMENT_ID;
import static to.bconnect.api.support.fixture.FixtureConstant.MIN_DATE_TIME;

public class PostFactory {

    public static Post domain(Long id, Long memberId, Long taskId) {
        return new Post(id, memberId, taskId, "content",
                MIN_DATE_TIME, MIN_DATE_TIME);
    }

    public static PostEntity entity(Long memberId, Long taskId) {
        return new PostEntity(memberId, taskId, "content");
    }

    public static CreatePost createCommand() {
        return new CreatePost(1L, List.of(DEFAULT_ATTACHMENT_ID), "content");
    }

    public static UpdatePost updateCommand() {
        return new UpdatePost(1L, List.of(DEFAULT_ATTACHMENT_ID), "updated content");
    }
}
