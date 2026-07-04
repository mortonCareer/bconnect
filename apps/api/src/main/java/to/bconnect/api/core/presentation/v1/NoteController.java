package to.bconnect.api.core.presentation.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.core.domain.board.NoteService;
import to.bconnect.api.core.presentation.v1.request.CreateNoteRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateNoteRequest;
import to.bconnect.api.security.AuthUser;

@RestController
@RequestMapping("/api/v1/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid CreateNoteRequest request) {
        val id = noteService.create(user, request.toCommand());
        return ApiResponse.success(id);
    }

    @PutMapping("/{id}")
    public ApiResponse<Void> update(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id,
            @RequestBody @Valid UpdateNoteRequest request) {
        noteService.update(user, id, request.content());
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        noteService.delete(user, id);
        return ApiResponse.success(null);
    }
}
