package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.core.domain.post.Post;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.core.domain.member.Member;

import java.util.List;

public record FeedResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) MemberSummaryResponse member,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) ProfileSummaryResponse profile,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) PostResponse post,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) TaskResponse task
) {
    public static FeedResponse of(Post post, Member member, Profile profile, TaskResponse task,
                                  List<String> images, List<PostAttachmentResponse> attachments, String picture) {
        return new FeedResponse(
                MemberSummaryResponse.of(member, picture),
                ProfileSummaryResponse.of(profile),
                PostResponse.of(post, images, attachments),
                task
        );
    }
}
