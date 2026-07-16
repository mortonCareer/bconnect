package to.bconnect.api.core.presentation.v1.response;

import io.swagger.v3.oas.annotations.media.Schema;

public record CheckUsernameResponse(@Schema(requiredMode = Schema.RequiredMode.REQUIRED) boolean available) {}
