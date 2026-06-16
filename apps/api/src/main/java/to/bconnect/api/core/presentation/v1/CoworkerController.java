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
import to.bconnect.api.core.domain.coworker.Coworker;
import to.bconnect.api.core.domain.coworker.CoworkerService;
import to.bconnect.api.core.domain.MemberResolver;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.core.domain.profile.ProfileQueryService;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.storage.coworker.CoworkerStatus;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.common.response.ApiResponse;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/coworkers")
@RequiredArgsConstructor
public class CoworkerController {

    private final CoworkerService coworkerService;
    private final MemberResolver memberResolver;
    private final ProfileQueryService profileQueryService;

    @GetMapping
    public ApiResponse<List<CoworkerResponse>> list(
            @AuthenticationPrincipal AuthUser user,
            @RequestParam Long memberId) {
        List<Coworker> coworkers = coworkerService.list(memberId);

        List<Long> memberIds = coworkers.stream().map(Coworker::memberId).distinct().toList();
        Map<Long, Member> memberMap = memberResolver.resolveMap(memberIds);
        Map<Long, Profile> profileMap = profileQueryService.resolveMap(memberIds);
        Map<Long, CoworkerStatus> statusMap = coworkerService.resolveStatusMap(user.id(), memberIds);

        List<CoworkerResponse> response = coworkers.stream()
                .map(it -> CoworkerResponse.of(
                        it,
                        memberMap.get(it.memberId()),
                        profileMap.get(it.memberId()),
                        statusMap.get(it.memberId())))
                .toList();
        return ApiResponse.success(response);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        coworkerService.delete(user, id);
        return ApiResponse.success(null);
    }
}
