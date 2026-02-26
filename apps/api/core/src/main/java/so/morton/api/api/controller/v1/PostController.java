package so.morton.api.api.controller.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import so.morton.api.api.controller.v1.request.CreatePostRequest;
import so.morton.api.api.controller.v1.request.UpdatePostRequest;
import so.morton.api.api.controller.v1.response.PostResponse;
import so.morton.api.domain.post.Post;
import so.morton.api.domain.post.PostService;
import so.morton.api.support.auth.User;
import so.morton.api.support.response.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/v1/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping
    public ApiResponse<PostResponse> create(
            @AuthenticationPrincipal User user,
            @RequestBody @Valid CreatePostRequest request) {
        Post post = postService.create(user.id(), request);
        return ApiResponse.success(PostResponse.of(post));
    }

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

    @PutMapping("/{id}")
    public ApiResponse<PostResponse> update(
            @PathVariable Long id,
            @AuthenticationPrincipal User user,
            @RequestBody @Valid UpdatePostRequest request) {
        Post post = postService.update(id, user.id(), request);
        return ApiResponse.success(PostResponse.of(post));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        postService.delete(id, user.id());
        return ApiResponse.success(null);
    }
}
