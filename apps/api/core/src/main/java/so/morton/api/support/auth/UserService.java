package so.morton.api.support.auth;

import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import so.morton.api.storage.domain.member.MemberRepository;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {
    private final MemberRepository memberRepository;

    @Override @NonNull
    public UserDetails loadUserByUsername(@NonNull String username) throws UsernameNotFoundException {
        return memberRepository.findByUsername(username)
            .map(entity -> new User(entity.getId(), entity.getUsername(), entity.getRole().name()))
            .orElseThrow(() -> new UsernameNotFoundException(username));
    }
}
