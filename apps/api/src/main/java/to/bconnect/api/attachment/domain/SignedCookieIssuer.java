package to.bconnect.api.attachment.domain;

import org.springframework.http.ResponseCookie;

import java.util.List;

public interface SignedCookieIssuer {
    List<ResponseCookie> issue(String scope);
}
