package to.bconnect.api.storage;

import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class Address {
    @NotBlank
    @Size(max = 5)
    private String zipcode;

    @NotNull
    @Enumerated(EnumType.STRING)
    private Region state;

    @NotBlank
    private String city;

    @NotBlank
    private String street;

    private String detail;

    @NotNull
    private BigDecimal latitude;

    @NotNull
    private BigDecimal longitude;
}
