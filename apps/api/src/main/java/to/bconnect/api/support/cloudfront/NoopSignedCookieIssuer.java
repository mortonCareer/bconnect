package to.bconnect.api.support.cloudfront;

import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Profile({"local", "test"})
public class NoopSignedCookieIssuer implements SignedCookieIssuer {

    @Override
    public List<ResponseCookie> issue(String path) {
        return List.of();
    }
}
