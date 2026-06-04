package to.bconnect.api.api.controller.v1;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import to.bconnect.api.api.controller.v1.response.FeedResponse;
import to.bconnect.api.domain.feed.FeedService;
import to.bconnect.api.common.response.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/feeds")
@RequiredArgsConstructor
public class FeedController {

    private final FeedService feedService;

    @GetMapping
    public ApiResponse<List<FeedResponse>> list(@RequestParam(required = false) Long profileId) {
        List<FeedResponse> feeds = feedService.getAll().stream()
                .map(FeedResponse::of)
                .toList();
        return ApiResponse.success(feeds);
    }

    @GetMapping("/{id}")
    public ApiResponse<FeedResponse> get(@PathVariable Long id) {
        return ApiResponse.success(FeedResponse.of(feedService.get(id)));
    }
}
