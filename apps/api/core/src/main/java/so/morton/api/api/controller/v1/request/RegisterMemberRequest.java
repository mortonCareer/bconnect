package so.morton.api.api.controller.v1.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import so.morton.api.storage.support.Address;
import so.morton.api.storage.support.Regex;
import so.morton.api.storage.value.Role;
import so.morton.api.storage.value.Trade;

import java.util.Set;

public record RegisterMemberRequest(
        @NotBlank String signupToken,
        @NotBlank String username,
        @NotBlank String name,
        @NotBlank @Pattern(regexp = Regex.PHONE) String phone,
        @NotBlank String picture,
        @NotNull Trade primaryTrade,
        @NotEmpty Set<Trade> trades,
        @PositiveOrZero int experience,
        @NotNull Role role,
        String headline,
        String about,
        Address address
) {}
