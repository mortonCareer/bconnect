package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.core.domain.post.Post;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.core.domain.member.Member;
import to.bconnect.api.core.domain.task.Task;
import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.task.TaskType;

import java.util.List;

public record FeedResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) MemberSummaryResponse member,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) ProfileSummaryResponse profile,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) PostResponse post,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) TaskResponse task
) {
    public static FeedResponse of(Post post, Member member, Profile profile, Task task, Address projectAddress, List<String> images, String picture) {
        return new FeedResponse(
                MemberSummaryResponse.of(member, picture),
                ProfileSummaryResponse.of(profile),
                PostResponse.of(post, images),
                toTaskResponse(task, projectAddress)
        );
    }

    private static TaskResponse toTaskResponse(Task task, Address projectAddress) {
        if (task == null)
            return null;

        Address address = task.type() == TaskType.WORKER
                ? task.workerAddress()
                : projectAddress;
        return TaskResponse.of(task, address);
    }
}
