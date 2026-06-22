package to.bconnect.api.support.fixture;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class FixtureConstant {

    public static final LocalDate MIN_DATE = LocalDate.of(2000, 1, 1);
    public static final LocalDate MAX_DATE = LocalDate.of(2050, 12, 31);

    public static final LocalDateTime MIN_DATE_TIME = LocalDateTime.of(2000, 1, 1, 0, 0, 0);
    public static final LocalDateTime MAX_DATE_TIME = LocalDateTime.of(2050, 12, 31, 23, 59, 59);
}
