package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;
import to.bconnect.api.core.domain.member.Member;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.storage.Address;
import to.bconnect.api.storage.profile.ProfileRole;
import to.bconnect.api.storage.profile.Trade;

import java.time.LocalDateTime;
import java.util.Set;

public record ProfileResponse(
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) MemberSummaryResponse member,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) ProfileRole role,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Trade primaryTrade,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Set<Trade> trades,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) int experience,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String headline,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED, nullable = true) String about,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Address address,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDateTime createdAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) LocalDateTime modifiedAt,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) int postCount,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) int recommendationCount,
        @Schema(requiredMode = Schema.RequiredMode.REQUIRED) int coworkerCount
) {
    public static ProfileResponse of(Profile detail, Member member, String picture) {
        return new ProfileResponse(
                detail.id(),
                MemberSummaryResponse.of(member, picture),
                detail.role(),
                detail.primaryTrade(),
                detail.trades(),
                detail.experience(),
                detail.headline(),
                detail.about(),
                detail.address(),
                detail.createdAt(),
                detail.modifiedAt(),
                detail.postCount().intValue(),
                detail.recommendationCount().intValue(),
                detail.coworkerCount().intValue()
        );
    }
}
