package to.bconnect.api.core.presentation.v1;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import to.bconnect.api.attachment.domain.AttachmentResolver;
import to.bconnect.api.attachment.domain.ImageSize;
import to.bconnect.api.attachment.presentation.v1.AttachmentResponse;
import to.bconnect.api.common.response.ApiResponse;
import to.bconnect.api.core.domain.drive.DriveService;
import to.bconnect.api.core.presentation.v1.request.CreateDriveRequest;
import to.bconnect.api.core.presentation.v1.request.UpdateDriveRequest;
import to.bconnect.api.core.presentation.v1.response.DriveResponse;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.AttachmentType;

import java.util.List;

@RestController
@RequestMapping("/api/v1/drives")
@RequiredArgsConstructor
public class DriveController {

    private final DriveService driveService;
    private final AttachmentResolver attachmentResolver;

    @GetMapping(params = "projectId")
    public ApiResponse<List<DriveResponse>> listByProject(
            @AuthenticationPrincipal AuthUser user,
            @RequestParam Long projectId) {
        val response = driveService.listByProject(user, projectId).stream()
                .map(DriveResponse::of)
                .toList();
        return ApiResponse.success(response);
    }

    @GetMapping
    public ApiResponse<List<DriveResponse>> listByMember(
            @AuthenticationPrincipal AuthUser user) {
        val response = driveService.listByMember(user).stream()
                .map(DriveResponse::of)
                .toList();
        return ApiResponse.success(response);
    }

    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal AuthUser user,
            @RequestBody @Valid CreateDriveRequest request) {
        val id = driveService.create(user, request.toCommand());
        return ApiResponse.success(id);
    }

    @PutMapping("/{id}")
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
            @PathVariable Long id) {
        val response = driveService.listAttachments(user, id, AttachmentType.IMAGE).stream()
                .map(it -> AttachmentResponse.of(it, attachmentResolver.parseUrl(it, ImageSize.SMALL)))
                .toList();
        return ApiResponse.success(response);
    }

    @GetMapping("/{id}/files")
    public ApiResponse<List<AttachmentResponse>> listFiles(
            @AuthenticationPrincipal AuthUser user,
            @PathVariable Long id) {
        val response = driveService.listAttachments(user, id, AttachmentType.FILE).stream()
                .map(it -> AttachmentResponse.of(it, attachmentResolver.parseUrl(it, ImageSize.ORIGINAL)))
                .toList();
        return ApiResponse.success(response);
    }
}
