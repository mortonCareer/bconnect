package to.bconnect.api.security.session;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.storage.domain.member.MemberRepository;
import to.bconnect.api.storage.domain.session.SessionEntity;
import to.bconnect.api.storage.domain.session.SessionRepository;
import to.bconnect.api.security.AuthExceptionCode;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.security.AuthUtils;
import to.bconnect.api.support.sms.SmsProvider;
import to.bconnect.api.support.sms.SmsTemplate;

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

        if (!AuthUtils.sha256(refreshToken).equals(found.getRefreshToken())) {
            throw new CodeException(AuthExceptionCode.INVALID_REFRESH_TOKEN);
        }

        if (found.isRevoked()) {
            throw new CodeException(AuthExceptionCode.SESSION_EXPIRED);
        }
    }

    public void login(String username, String agent, String ip, String refreshToken) {
        Optional<SessionEntity> found = sessionRepository.findByUsername(username);
        String encrypted = AuthUtils.sha256(refreshToken);

        if (found.isPresent()) {
            found.get().update(agent, ip, encrypted);
        } else {
            sessionRepository.save(
                    SessionEntity.builder()
                            .username(username)
                            .agent(agent)
                            .ip(ip)
                            .refreshToken(encrypted)
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

    public void rotate(String username, String refreshToken) {
        SessionEntity found = sessionRepository.findByUsername(username)
                .orElseThrow(() -> new CodeException(AuthExceptionCode.SESSION_EXPIRED));

        found.rotate(AuthUtils.sha256(refreshToken));
    }

    public void logout(String username) {
        SessionEntity found = sessionRepository.findByUsername(username)
                .orElseThrow(() -> new CodeException(AuthExceptionCode.SESSION_EXPIRED));

        found.revoke();
    }
}
