package to.bconnect.api.crawler.presentation.v1;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.crawler.domain.CrawledMemberService;
import to.bconnect.api.crawler.presentation.v1.response.CrawledMemberResponse;
import to.bconnect.api.crawler.presentation.v1.response.CrawledMemberSummaryResponse;
import to.bconnect.api.crawler.storage.CrawledCredentialEntity;
import to.bconnect.api.crawler.storage.CrawledMemberEntity;
import to.bconnect.api.crawler.storage.CrawledPostEntity;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/v1/crawled-members")
@RequiredArgsConstructor
public class CrawledMemberController {

    private final CrawledMemberService crawledMemberService;

    @GetMapping
    public ApiResponse<List<CrawledMemberSummaryResponse>> list() {
        val members = crawledMemberService.list();
        val memberIds = members.stream().map(CrawledMemberEntity::getId).toList();
        val profileMap = crawledMemberService.getProfileMap(memberIds);

        val body = members.stream()
                .map(it -> CrawledMemberSummaryResponse.of(it, profileMap.get(it.getId())))
                .toList();

        return ApiResponse.success(body);
    }

    @GetMapping("/{id}")
    public ApiResponse<CrawledMemberResponse> get(@PathVariable Long id) {
        val member = crawledMemberService.get(id);
        val profile = crawledMemberService.getProfileMap(List.of(id)).get(id);
        val credentials = profile == null
                ? List.<CrawledCredentialEntity>of()
                : crawledMemberService.listCredential(profile.getId());
        val posts = profile == null
                ? List.<CrawledPostEntity>of()
                : crawledMemberService.listPost(profile.getId());
        val taskIds = posts.stream().map(CrawledPostEntity::getTaskId).filter(Objects::nonNull).toList();
        val taskMap = crawledMemberService.getTaskMap(taskIds);

        return ApiResponse.success(CrawledMemberResponse.of(member, profile, credentials, posts, taskMap));
    }
}
