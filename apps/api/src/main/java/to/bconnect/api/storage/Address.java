package to.bconnect.api.storage;

import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
    private String zipcode;

    @Enumerated(EnumType.STRING)
    private Region state;

    private String city;

    private String street;

    private String detail;

    private BigDecimal latitude;

    private BigDecimal longitude;
}
