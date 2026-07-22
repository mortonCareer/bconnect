package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import to.bconnect.api.core.domain.post.CreatePost;

import java.util.List;

public record CreatePostRequest(
        Long taskId,
        @NotEmpty List<Long> attachmentIds,
        @NotBlank String content
) {
    public CreatePost toCommand() {
        return new CreatePost(taskId, attachmentIds, content);
    }
}
