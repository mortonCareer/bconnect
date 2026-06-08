package to.bconnect.api.core.presentation.v1;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.core.presentation.v1.response.CoworkerResponse;
import to.bconnect.api.core.domain.coworker.CoworkerService;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.security.member.MemberFinder;
import to.bconnect.api.core.domain.profile.ProfileFinder;
import to.bconnect.api.core.storage.coworker.CoworkerStatus;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.common.response.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/coworkers")
@RequiredArgsConstructor
public class CoworkerController {

    private final CoworkerService coworkerService;
    private final ProfileFinder profileFinder;
    private final MemberFinder memberFinder;

    @GetMapping
    public ApiResponse<List<CoworkerResponse>> list(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestParam Long profileId) {
        List<CoworkerResponse> coworkers = coworkerService.list(authUser, profileId).stream()
                .map(coworker -> {
                    Long counterpartProfileId = coworker.minId().equals(profileId)
                            ? coworker.maxId()
                            : coworker.minId();
                    Member member = memberFinder.find(
                            profileFinder.find(counterpartProfileId).memberId());
                    return CoworkerResponse.of(coworker, member, CoworkerStatus.COWORKER);
                })
                .toList();
        return ApiResponse.success(coworkers);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable Long id) {
        coworkerService.delete(authUser, id);
        return ApiResponse.success(null);
    }
}
