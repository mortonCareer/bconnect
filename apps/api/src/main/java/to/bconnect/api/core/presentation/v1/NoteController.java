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
import to.bconnect.api.core.presentation.v1.response.NoteResponse;
import to.bconnect.api.security.AuthUser;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;

    @GetMapping(params = "projectId")
    public ApiResponse<List<NoteResponse>> listByProject(
            @AuthenticationPrincipal AuthUser user,
            @RequestParam Long projectId) {
        val response = noteService.listByProject(user, projectId).stream()
                .map(NoteResponse::of)
                .toList();
        return ApiResponse.success(response);
    }

    @GetMapping(params = "driveId")
    public ApiResponse<List<NoteResponse>> listByDrive(
            @AuthenticationPrincipal AuthUser user,
            @RequestParam Long driveId) {
        val response = noteService.listByDrive(user, driveId).stream()
                .map(NoteResponse::of)
                .toList();
        return ApiResponse.success(response);
    }

    @PostMapping(params = "projectId")
    public ApiResponse<Long> createByProject(
            @AuthenticationPrincipal AuthUser user,
            @RequestParam Long projectId,
            @RequestBody @Valid CreateNoteRequest request) {
        val id = noteService.createByProject(user, projectId, request.content());
        return ApiResponse.success(id);
    }

    @PostMapping(params = "driveId")
    public ApiResponse<Long> createByDrive(
            @AuthenticationPrincipal AuthUser user,
            @RequestParam Long driveId,
            @RequestBody @Valid CreateNoteRequest request) {
        val id = noteService.createByDrive(user, driveId, request.content());
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
