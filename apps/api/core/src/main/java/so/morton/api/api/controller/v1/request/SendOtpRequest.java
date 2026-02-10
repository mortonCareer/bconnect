package so.morton.api.api.controller.v1.request;

import jakarta.validation.constraints.NotBlank;

public record SendOtpRequest(@NotBlank String phone) {}
