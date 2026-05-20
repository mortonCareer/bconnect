package so.morton.api.api.controller.v1;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import so.morton.api.api.controller.v1.response.CoworkerResponse;
import so.morton.api.domain.coworker.CoworkerService;
import so.morton.api.support.auth.User;
import so.morton.api.support.response.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/coworkers")
@RequiredArgsConstructor
public class CoworkerController {

    private final CoworkerService coworkerService;

    @GetMapping
    public ApiResponse<List<CoworkerResponse>> get(
            @AuthenticationPrincipal User user,
            @RequestParam Long profileId) {
        coworkerService.getAll(user, profileId);
        // TODO: Coworker -> CoworkerResponse 매핑 구현
        //  - member: pair(minId, maxId) 중 조회 기준 profileId 가 아닌 상대 프로필의 멤버
        //  - status: 동료 관계 상태 (CoworkerStatus)
        //  - CoworkerResponse.of(Coworker, Member, CoworkerStatus) 호출
        return ApiResponse.success(List.of());
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        coworkerService.delete(user, id);
        return ApiResponse.success(null);
    }
}
