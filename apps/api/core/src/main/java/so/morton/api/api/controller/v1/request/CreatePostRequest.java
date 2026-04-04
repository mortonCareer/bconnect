package so.morton.api.api.controller.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.hibernate.validator.constraints.URL;

import java.util.List;

public record CreatePostRequest(
        Long taskId,
        @NotNull @Size(min = 1) List<@URL String> images,
        @NotBlank String content
) {}
