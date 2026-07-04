package to.bconnect.api.attachment.infrastructure.cloudfront;

import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import to.bconnect.api.attachment.domain.SignedCookieIssuer;

import java.util.List;

@Component
@Profile({"local", "test"})
public class NoopSignedCookieIssuer implements SignedCookieIssuer {

    @Override
    public List<ResponseCookie> issue(String scope) {
        return List.of();
    }
}
