package to.bconnect.api.security.session;

import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.storage.member.MemberRepository;
import to.bconnect.api.security.AuthExceptionCode;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.security.AuthUtils;
import to.bconnect.api.storage.session.SessionEntity;
import to.bconnect.api.storage.session.SessionRepository;
import to.bconnect.api.support.sms.SmsProvider;
import to.bconnect.api.support.sms.SmsTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionService {

    private final SessionRepository sessionRepository;
    private final MemberRepository memberRepository;
    private final SmsProvider smsProvider;

    @Transactional(readOnly = true)
    public void verify(String username, String refreshToken) {
        val found = findSession(username);

        if (!AuthUtils.sha256(refreshToken).equals(found.getRefreshToken())) {
            throw new CodeException(AuthExceptionCode.INVALID_REFRESH_TOKEN);
        }

        if (found.isRevoked()) {
            throw new CodeException(AuthExceptionCode.SESSION_EXPIRED);
        }
    }

    @Transactional
    public void login(String username, String agent, String ip, String refreshToken) {
        val member = memberRepository.findByUsername(username)
                .orElseThrow(() -> new CodeException(AuthExceptionCode.SESSION_EXPIRED));
        val encrypted = AuthUtils.sha256(refreshToken);
        val optional = sessionRepository.findByMemberId(member.getId());

        if (optional.isPresent()) {
            optional.get().update(agent, ip, encrypted);
        } else {
            sessionRepository.save(
                    new SessionEntity(member.getId(), agent, ip, encrypted)
            );

            // TODO: 새로운 기기에서 로그인시 세션 덮어쓰기 → RT 무효화
            smsProvider.send(member.getPhone(), SmsTemplate.NEW_DEVICE_LOGIN);
        }
    }

    @Transactional
    public void rotate(String username, String refreshToken) {
        findSession(username).rotate(AuthUtils.sha256(refreshToken));
    }

    @Transactional
    public void logout(String username) {
        findSession(username).revoke();
    }

    private SessionEntity findSession(String username) {
        val member = memberRepository.findByUsername(username)
                .orElseThrow(() -> new CodeException(AuthExceptionCode.SESSION_EXPIRED));

        return sessionRepository.findByMemberId(member.getId())
                .orElseThrow(() -> new CodeException(AuthExceptionCode.SESSION_EXPIRED));
    }
}
