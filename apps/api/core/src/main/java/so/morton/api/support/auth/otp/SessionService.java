package so.morton.api.support.auth.otp;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import so.morton.api.storage.domain.member.MemberRepository;
import so.morton.api.storage.domain.session.SessionEntity;
import so.morton.api.storage.domain.session.SessionRepository;
import so.morton.api.support.AuthExceptionCode;
import so.morton.api.support.CodeException;
import so.morton.api.support.sms.SmsProvider;
import so.morton.api.support.sms.SmsTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class SessionService {

    private final SessionRepository sessionRepository;
    private final MemberRepository memberRepository;
    private final SmsProvider smsProvider;

    public void verify(String username, String refreshToken) {
        SessionEntity found = sessionRepository.findByUsername(username)
                .orElseThrow(() -> new CodeException(AuthExceptionCode.SESSION_EXPIRED));

        if (!sha256(refreshToken).equals(found.getRefreshToken())) {
            throw new CodeException(AuthExceptionCode.INVALID_REFRESH_TOKEN);
        }

        if (found.isRevoked()) {
            throw new CodeException(AuthExceptionCode.SESSION_EXPIRED);
        }
    }

    public void login(String username, String agent, String ip, String refreshToken) {
        Optional<SessionEntity> found = sessionRepository.findByUsername(username);
        String hashed = sha256(refreshToken);

        if (found.isPresent()) {
            found.get().update(agent, ip, hashed);
        } else {
            sessionRepository.save(
                    SessionEntity.builder()
                            .username(username)
                            .agent(agent)
                            .ip(ip)
                            .refreshToken(hashed)
                            .build()
            );

            // TODO: 새로운 기기에서 로그인시 세션 덮어쓰기 → RT 무효화
            memberRepository.findByUsername(username)
                    .ifPresent(e -> smsProvider.send(
                            e.getPhone(),
                            SmsTemplate.NEW_DEVICE_LOGIN
                    ));
        }
    }

    private static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    public void logout(String username) {
        SessionEntity found = sessionRepository.findByUsername(username)
                .orElseThrow(() -> new CodeException(AuthExceptionCode.SESSION_EXPIRED));

        found.revoke();
    }
}
