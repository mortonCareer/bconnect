package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import to.bconnect.api.core.domain.post.CreatePost;

import java.util.List;

public record CreatePostRequest(
        Long taskId,
        @NotNull @Size(min = 1) List<Long> attachmentIds,
        @NotBlank String content
) {
    public CreatePost toCommand() {
        return new CreatePost(taskId, attachmentIds, content);
    }
}
