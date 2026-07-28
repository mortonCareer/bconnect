package to.bconnect.api.support.fixture;

import to.bconnect.api.common.request.CursorLimit;

public class CursorFactory {

    public static CursorLimit request(Long cursor, Integer limit) {
        return new CursorLimit(cursor, limit, null);
    }
}
