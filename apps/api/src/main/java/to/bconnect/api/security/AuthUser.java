package to.bconnect.api.security;

import lombok.NonNull;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import to.bconnect.api.storage.member.Role;

import java.util.Collection;
import java.util.Set;

public record AuthUser(
    Long id,
    String username,
    Set<Role> roles
) implements UserDetails {

    public static final String ROLE_PREFIX = "ROLE_";

    @Override @NonNull
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles.stream()
                .map(it -> new SimpleGrantedAuthority(ROLE_PREFIX + it))
                .toList();
    }

    @Override
    public String getPassword() {
        return "";
    }

    @Override @NonNull
    public String getUsername() {
        return id.toString();
    }
}
