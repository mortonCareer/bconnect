package to.bconnect.api.support.fixture;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;

public class FixtureConstant {

    public static final LocalDate MIN_DATE = LocalDate.of(2000, 1, 1);
    public static final LocalDate MAX_DATE = LocalDate.of(2050, 12, 31);

    public static final OffsetDateTime MIN_DATE_TIME = OffsetDateTime.of(2000, 1, 1, 0, 0, 0, 0, ZoneOffset.ofHours(9));
    public static final OffsetDateTime MAX_DATE_TIME = OffsetDateTime.of(2050, 12, 31, 23, 59, 59, 0, ZoneOffset.ofHours(9));

    public static final Long DEFAULT_ATTACHMENT_ID = 1L;
}
