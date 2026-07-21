package to.bconnect.api.core.presentation.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import to.bconnect.api.core.domain.post.UpdatePost;

import java.util.List;

public record UpdatePostRequest(
        Long taskId,
        @NotEmpty List<Long> attachmentIds,
        @NotBlank String content
) {
    public UpdatePost toCommand() {
        return new UpdatePost(taskId, attachmentIds, content);
    }
}
