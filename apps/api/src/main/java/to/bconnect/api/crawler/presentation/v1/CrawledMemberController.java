package to.bconnect.api.crawler.presentation.v1;

import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.common.request.CursorLimit;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.common.response.CursorPage;
import to.bconnect.api.crawler.domain.CrawledMemberService;
import to.bconnect.api.crawler.presentation.v1.response.CrawledMemberResponse;
import to.bconnect.api.crawler.presentation.v1.response.CrawledMemberSummaryResponse;
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
    public ApiResponse<CursorPage<CrawledMemberSummaryResponse>> list(CursorLimit cursorLimit) {
        val page = crawledMemberService.list(cursorLimit);
        val members = page.content();
        val memberIds = members.stream().map(CrawledMemberEntity::getId).toList();
        val profileMap = crawledMemberService.resolveProfileMap(memberIds);
        val thumbnailMap = crawledMemberService.resolveThumbnailMap(memberIds);

        val content = members.stream()
                .map(it -> CrawledMemberSummaryResponse.of(
                        it, profileMap.get(it.getId()), thumbnailMap.getOrDefault(it.getId(), List.of())))
                .toList();

        return ApiResponse.success(new CursorPage<>(content, page.hasNext(), page.nextCursor()));
    }

    @GetMapping("/{id}")
    public ApiResponse<CrawledMemberResponse> get(@PathVariable Long id) {
        val member = crawledMemberService.get(id);
        val profile = crawledMemberService.getProfile(id).orElse(null);
        val credentials = crawledMemberService.listCredential(id);
        val posts = crawledMemberService.listPost(id);
        val taskIds = posts.stream().map(CrawledPostEntity::getTaskId).filter(Objects::nonNull).toList();
        val taskMap = crawledMemberService.resolveTaskMap(taskIds);

        return ApiResponse.success(CrawledMemberResponse.of(member, profile, credentials, posts, taskMap));
    }
}
