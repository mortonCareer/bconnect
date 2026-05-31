package to.bconnect.api.api.controller.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import to.bconnect.api.api.controller.v1.request.CreatePostRequest;
import to.bconnect.api.api.controller.v1.request.UpdatePostRequest;
import to.bconnect.api.api.controller.v1.response.PostResponse;
import to.bconnect.api.domain.post.Post;
import to.bconnect.api.domain.post.PostService;
import to.bconnect.api.support.security.User;
import to.bconnect.api.common.response.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @GetMapping
    public ApiResponse<List<PostResponse>> getAll() {
        List<PostResponse> posts = postService.getAll().stream()
                .map(PostResponse::of)
                .toList();
        return ApiResponse.success(posts);
    }

    @GetMapping("/{id}")
    public ApiResponse<PostResponse> get(@PathVariable Long id) {
        Post post = postService.get(id);
        return ApiResponse.success(PostResponse.of(post));
    }

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal User user,
            @RequestBody @Valid CreatePostRequest request) {
        Post post = postService.create(user, request);
        return ApiResponse.success(post.id());
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> update(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody @Valid UpdatePostRequest request) {
        postService.update(user, id, request.content());
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        postService.delete(user, id);
        return ApiResponse.success(null);
    }
}
