package to.bconnect.api.security;

import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import to.bconnect.api.core.storage.member.MemberRepository;

@Service
@RequiredArgsConstructor
public class AuthUserService implements UserDetailsService {
    private final MemberRepository memberRepository;

    @Override @NonNull
    public UserDetails loadUserByUsername(@NonNull String username) throws UsernameNotFoundException {
        return memberRepository.findById(Long.valueOf(username))
            .map(e -> new AuthUser(e.getId(), e.getUsername(), e.getRole().name()))
            .orElseThrow(() -> new UsernameNotFoundException(username));
    }

    public UserDetails loadUserByPhone(@NonNull String phone) throws UsernameNotFoundException {
        return memberRepository.findByPhone(phone)
            .map(e -> new AuthUser(e.getId(), e.getUsername(), e.getRole().name()))
            .orElseThrow(() -> new UsernameNotFoundException(phone));
    }
}
