package to.bconnect.api.support.fixture;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

public class FixtureConstant {

    public static final LocalDate MIN_DATE = LocalDate.of(2000, 1, 1);
    public static final LocalDate MAX_DATE = LocalDate.of(2050, 12, 31);

    public static final Instant MIN_DATE_TIME = LocalDateTime.of(2000, 1, 1, 0, 0, 0).toInstant(ZoneOffset.ofHours(9));
    public static final Instant MAX_DATE_TIME = LocalDateTime.of(2050, 12, 31, 23, 59, 59).toInstant(ZoneOffset.ofHours(9));

    public static final Long DEFAULT_ATTACHMENT_ID = 1L;
}
