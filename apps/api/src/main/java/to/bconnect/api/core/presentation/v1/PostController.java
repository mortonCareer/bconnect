package to.bconnect.api.core.presentation.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import to.bconnect.api.core.presentation.v1.request.CreatePostRequest;
import to.bconnect.api.core.presentation.v1.request.UpdatePostRequest;
import to.bconnect.api.core.domain.post.Post;
import to.bconnect.api.core.domain.post.PostService;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.common.response.ApiResponse;

@RestController
@RequestMapping("/api/v1/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal AuthUser authUser,
            @RequestBody @Valid CreatePostRequest request) {
        Post post = postService.create(authUser, request);
        return ApiResponse.success(post.id());
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> update(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable Long id,
            @RequestBody @Valid UpdatePostRequest request) {
        postService.update(authUser, id, request.content());
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal AuthUser authUser,
            @PathVariable Long id) {
        postService.delete(authUser, id);
        return ApiResponse.success(null);
    }
}
