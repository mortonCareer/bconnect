package so.morton.api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import so.morton.api.api.controller.v1.request.CreateUserRequest;
import so.morton.api.api.controller.v1.request.UpdateUserRequest;
import so.morton.api.domain.User;
import so.morton.api.storage.entity.UserEntity;
import so.morton.api.storage.repository.UserRepository;
import so.morton.api.storage.value.EntityStatus;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserFinder userFinder;

    @Transactional
    public User create(CreateUserRequest request) {
        UserEntity entity = UserEntity.builder()
                .username(request.username())
                .name(request.name())
                .phone(request.phone())
                .picture(request.picture())
                .primaryTrade(request.primaryTrade())
                .trades(request.trades())
                .experience(request.experience())
                .role(request.role())
                .headline(request.headline())
                .about(request.about())
                .address(request.address())
                .build();

        UserEntity saved = userRepository.save(entity);
        return User.of(saved);
    }

    @Transactional(readOnly = true)
    public User get(Long userId) {
        return userFinder.find(userId);
    }

    @Transactional
    public User update(Long userId, UpdateUserRequest request) {
        UserEntity entity = userRepository.findById(userId)
                .filter(e -> e.getStatus() == EntityStatus.ACTIVE)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        entity.update(
                request.name(),
                request.phone(),
                request.picture(),
                request.primaryTrade(),
                request.trades(),
                request.experience(),
                request.headline(),
                request.about(),
                request.address()
        );

        return User.of(entity);
    }

    @Transactional
    public void delete(Long userId) {
        UserEntity entity = userRepository.findById(userId)
                .filter(e -> e.getStatus() == EntityStatus.ACTIVE)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        entity.delete();
    }
}
