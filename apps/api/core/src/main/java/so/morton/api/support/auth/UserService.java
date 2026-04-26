package so.morton.api.support.auth;

import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import so.morton.api.domain.profile.ProfileFinder;
import so.morton.api.storage.domain.member.MemberEntity;
import so.morton.api.storage.domain.member.MemberRepository;
import so.morton.api.support.CodeException;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {
    private final MemberRepository memberRepository;
    private final ProfileFinder profileFinder;

    @Override @NonNull
    public UserDetails loadUserByUsername(@NonNull String username) throws UsernameNotFoundException {
        return memberRepository.findByUsername(username)
            .map(this::toUser)
            .orElseThrow(() -> new UsernameNotFoundException(username));
    }

    public UserDetails loadUserByPhone(@NonNull String phone) throws UsernameNotFoundException {
        return memberRepository.findByPhone(phone)
            .map(this::toUser)
            .orElseThrow(() -> new UsernameNotFoundException(phone));
    }

    public UserDetails loadUserById(@NonNull Long memberId) throws UsernameNotFoundException {
        return memberRepository.findById(memberId)
            .map(this::toUser)
            .orElseThrow(() -> new UsernameNotFoundException(String.valueOf(memberId)));
    }

    private User toUser(MemberEntity entity) {
        return new User(
            entity.getId(),
            entity.getUsername(),
            findProfileIdSafely(entity.getId()),
            entity.getRole().name()
        );
    }

    private Long findProfileIdSafely(Long memberId) {
        try {
            return profileFinder.findByMemberId(memberId).id();
        } catch (CodeException e) {
            return null;
        }
    }
}
