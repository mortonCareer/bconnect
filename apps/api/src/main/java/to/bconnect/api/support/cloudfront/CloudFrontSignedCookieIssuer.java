package to.bconnect.api.support.cloudfront;

import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.cloudfront.CloudFrontUtilities;
import software.amazon.awssdk.services.cloudfront.cookie.CookiesForCustomPolicy;
import software.amazon.awssdk.services.cloudfront.model.CustomSignerRequest;

import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.stream.Stream;

/**
 * issue cookies using custom policy
 */
@Component
@Profile({"prod", "dev"})
public class CloudFrontSignedCookieIssuer implements SignedCookieIssuer {

    private final CloudFrontProperties properties;
    private final CloudFrontUtilities utilities;
    private final PrivateKey key;

    public CloudFrontSignedCookieIssuer(CloudFrontProperties properties) {
        this.properties = properties;
        this.utilities = CloudFrontUtilities.create();
        this.key = parsePrivateKey(properties.privateKey());
    }

    @Override
    public List<ResponseCookie> issue(String path) {
        String url = "https://" + properties.domain() + "/" + path;
        CustomSignerRequest request = CustomSignerRequest.builder()
                .resourceUrl(url)
                .privateKey(key)
                .keyPairId(properties.keyPairId())
                .expirationDate(Instant.now().plus(properties.cookieTtl()))
                .build();

        CookiesForCustomPolicy cookies = utilities.getCookiesForCustomPolicy(request);

        return Stream.of(
                        cookies.policyHeaderValue(),
                        cookies.signatureHeaderValue(),
                        cookies.keyPairIdHeaderValue())
                .map(this::toResponseCookie)
                .toList();
    }

    private ResponseCookie toResponseCookie(String header) {
        int eq = header.indexOf('=');
        return ResponseCookie.from(header.substring(0, eq), header.substring(eq + 1))
                .domain(properties.cookieDomain())
                .path("/")
                .httpOnly(true)
                .secure(true)
                .sameSite("Lax")
                .build();
    }

    private PrivateKey parsePrivateKey(String pem) {
        String content = pem
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\s", "");
        byte[] decoded = Base64.getDecoder().decode(content);
        try {
            return KeyFactory.getInstance("RSA").generatePrivate(new PKCS8EncodedKeySpec(decoded));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("failed at parsing CloudFront private key", e);
        }
    }
}
