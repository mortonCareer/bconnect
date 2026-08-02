package to.bconnect.api.support.fixture;

import to.bconnect.api.core.domain.post.CreatePost;
import to.bconnect.api.core.domain.post.Post;
import to.bconnect.api.core.domain.post.UpdatePost;
import to.bconnect.api.storage.post.PostEntity;

import java.util.List;

import static to.bconnect.api.support.fixture.FixtureConstant.MIN_DATE_TIME;

public class PostFactory {

    private static final String CONTENT = "content";
    private static final String UPDATED_CONTENT = "updated content";

    public static Post domain(Long id, Long memberId, Long taskId) {
        return new Post(id, memberId, taskId, CONTENT,
                MIN_DATE_TIME, MIN_DATE_TIME);
    }

    public static PostEntity entity(Long memberId, Long taskId) {
        return new PostEntity(memberId, taskId, CONTENT);
    }

    public static CreatePost createCommand(Long taskId) {
        return new CreatePost(taskId, List.of(), CONTENT);
    }

    public static CreatePost createCommand(Long taskId, Long attachmentId) {
        return new CreatePost(taskId, List.of(attachmentId), CONTENT);
    }

    public static UpdatePost updateCommand(Long taskId) {
        return new UpdatePost(taskId, List.of(), UPDATED_CONTENT);
    }

    public static UpdatePost updateCommand(Long taskId, Long attachmentId) {
        return new UpdatePost(taskId, List.of(attachmentId), UPDATED_CONTENT);
    }
}
