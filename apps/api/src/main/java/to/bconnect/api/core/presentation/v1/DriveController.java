package to.bconnect.api.core.presentation.v1;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import to.bconnect.api.attachment.domain.AttachmentKeyUtils;
import to.bconnect.api.attachment.domain.AttachmentResolver;
import to.bconnect.api.attachment.domain.ImageSize;
import to.bconnect.api.attachment.domain.SignedCookieIssuer;
import to.bconnect.api.attachment.presentation.v1.AttachmentResponse;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.core.domain.board.NoteService;
import to.bconnect.api.core.domain.drive.DriveService;
import to.bconnect.api.core.presentation.v1.request.CreateDriveRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateDriveRequest;
import to.bconnect.api.core.presentation.v1.request.UploadDriveRequest;
import to.bconnect.api.core.presentation.v1.response.DriveResponse;
import to.bconnect.api.core.presentation.v1.response.NoteResponse;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentContext;
import to.bconnect.api.storage.attachment.AttachmentType;

import java.util.List;

@RestController
@RequestMapping("/api/v1/drives")
@RequiredArgsConstructor
public class DriveController {

    private final DriveService driveService;
    private final NoteService noteService;
    private final AttachmentResolver attachmentResolver;
    private final SignedCookieIssuer signedCookieIssuer;

    @GetMapping
    public ApiResponse<List<DriveResponse>> list(
            @AuthenticationPrincipal AuthUser user,
            @RequestParam Long projectId) {
        val body = driveService.listByProject(user, projectId).stream()
                .map(DriveResponse::of)
                .toList();
        return ApiResponse.success(body);
    }

    @GetMapping("/me")
    public ApiResponse<List<DriveResponse>> listMine(
            @AuthenticationPrincipal AuthUser user) {
        val body = driveService.listByMember(user).stream()
                .map(DriveResponse::of)
                .toList();
        return ApiResponse.success(body);
    }

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid CreateDriveRequest request) {
        val id = driveService.create(user, request.toCommand());
        return ApiResponse.success(id);
    }

    @PutMapping("/{id}/name")
    public ApiResponse<Void> rename(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id,
            @RequestBody @Valid UpdateDriveRequest request) {
        driveService.rename(user, id, request.title());
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        driveService.delete(user, id);
        return ApiResponse.success(null);
    }

    @GetMapping("/{id}/images")
    public ApiResponse<List<AttachmentResponse>> listImages(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id,
            HttpServletResponse response) {
        val body = driveService.listAttachments(user, id, AttachmentType.IMAGE).stream()
                .map(it -> AttachmentResponse.of(it, attachmentResolver.parseUrl(it, ImageSize.SMALL)))
                .toList();

        val scope = AttachmentKeyUtils.scope(AttachmentContext.DRIVE, id);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(body);
    }

    @GetMapping("/{id}/files")
    public ApiResponse<List<AttachmentResponse>> listFiles(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id,
            HttpServletResponse response) {
        val body = driveService.listAttachments(user, id, AttachmentType.FILE).stream()
                .map(it -> AttachmentResponse.of(it, attachmentResolver.parseUrl(it, ImageSize.ORIGINAL)))
                .toList();

        val scope = AttachmentKeyUtils.scope(AttachmentContext.DRIVE, id);
        signedCookieIssuer.issue(scope)
                .forEach(it -> response.addHeader(HttpHeaders.SET_COOKIE, it.toString()));

        return ApiResponse.success(body);
    }

    @PostMapping("/{id}/attachments")
    public ApiResponse<Void> upload(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id,
            @RequestBody @Valid UploadDriveRequest request) {
        driveService.attach(user, id, request.attachmentIds());
        return ApiResponse.success(null);
    }

    @DeleteMapping("/{id}/attachments/{attachmentId}")
    public ApiResponse<Void> detach(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id,
            @PathVariable Long attachmentId) {
        driveService.detach(user, id, attachmentId);
        return ApiResponse.success(null);
    }

    @GetMapping("/{id}/notes")
    public ApiResponse<List<NoteResponse>> listNotes(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        val body = noteService.listByDrive(user, id).stream()
                .map(NoteResponse::of)
                .toList();
        return ApiResponse.success(body);
    }
}
