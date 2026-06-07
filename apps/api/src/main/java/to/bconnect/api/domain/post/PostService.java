package to.bconnect.api.domain.post;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.presentation.v1.request.CreatePostRequest;
import to.bconnect.api.domain.profile.Profile;
import to.bconnect.api.domain.profile.ProfileFinder;
import to.bconnect.api.security.User;
import to.bconnect.api.storage.domain.post.PostEntity;
import to.bconnect.api.storage.domain.post.PostRepository;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final ProfileFinder profileFinder;

    @Transactional
    public Post create(User user, CreatePostRequest request) {
        Profile profile = profileFinder.findByMemberId(user.id());
        PostEntity post = PostEntity.builder()
                .profileId(profile.id())
                .taskId(request.taskId())
                .images(request.images())
                .content(request.content())
                .build();

        postRepository.save(post);
        return Post.of(post);
    }

    @Transactional
    public void update(User user, Long postId, String content) {
        Profile profile = profileFinder.findByMemberId(user.id());
        PostEntity found = postRepository.findById(postId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        if (!found.getProfileId().equals(profile.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.update(content);
    }

    @Transactional
    public void delete(User user, Long postId) {
        Profile profile = profileFinder.findByMemberId(user.id());
        postRepository.findById(postId).ifPresent(found -> {
            if (!found.getProfileId().equals(profile.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);
            postRepository.delete(found);
        });
    }
}
