package to.bconnect.api.security;

import lombok.extern.slf4j.Slf4j;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.storage.member.MemberRepository;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthUserService implements UserDetailsService {
    private final MemberRepository memberRepository;

    @Override @NonNull
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(@NonNull String username) throws UsernameNotFoundException {
        return memberRepository.findById(Long.valueOf(username))
            .map(it -> new AuthUser(it.getId(), it.getUsername(), it.getRoles()))
            .orElseThrow(() -> new UsernameNotFoundException(username));
    }

    @Transactional(readOnly = true)
    public UserDetails loadUserByPhone(@NonNull String phone) throws UsernameNotFoundException {
        return memberRepository.findByPhone(phone)
            .map(it -> new AuthUser(it.getId(), it.getUsername(), it.getRoles()))
            .orElseThrow(() -> new UsernameNotFoundException(phone));
    }
}
