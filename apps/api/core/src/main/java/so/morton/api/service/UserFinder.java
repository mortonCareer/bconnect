package so.morton.api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import so.morton.api.domain.User;
import so.morton.api.storage.repository.UserRepository;
import so.morton.api.storage.value.EntityStatus;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;

import java.util.List;

@Component
@RequiredArgsConstructor
public class UserFinder {

    private final UserRepository userRepository;

    public User find(Long userId) {
        return userRepository.findById(userId)
                .filter(e -> e.getStatus() == EntityStatus.ACTIVE)
                .map(User::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .filter(e -> e.getStatus() == EntityStatus.ACTIVE)
                .map(User::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    public List<User> findAllActive() {
        return userRepository.findAllByStatus(EntityStatus.ACTIVE)
                .stream()
                .map(User::of)
                .toList();
    }
}
