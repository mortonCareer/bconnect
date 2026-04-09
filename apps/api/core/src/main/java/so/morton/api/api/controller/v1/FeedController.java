package so.morton.api.api.controller.v1;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import so.morton.api.api.controller.v1.response.FeedResponse;
import so.morton.api.domain.feed.FeedService;
import so.morton.api.support.response.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/feeds")
@RequiredArgsConstructor
public class FeedController {

    private final FeedService feedService;

    @GetMapping
    public ApiResponse<List<FeedResponse>> getAll(@RequestParam(required = false) Long profileId) {
        List<FeedResponse> feeds = feedService.getAll().stream()
                .map(FeedResponse::of)
                .toList();
        return ApiResponse.success(feeds);
    }
}
