package so.morton.api.domain.post;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import so.morton.api.api.controller.v1.request.CreatePostRequest;
import so.morton.api.domain.profile.Profile;
import so.morton.api.domain.profile.ProfileFinder;
import so.morton.api.support.auth.User;
import so.morton.api.storage.domain.post.PostEntity;
import so.morton.api.storage.domain.post.PostRepository;
import so.morton.api.support.CodeException;
import so.morton.api.support.CommonExceptionCode;

import java.util.List;
@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final PostFinder postFinder;
    private final ProfileFinder profileFinder;

    @Transactional(readOnly = true)
    public Post get(Long postId) {
        return postFinder.find(postId);
    }

    @Transactional(readOnly = true)
    public List<Post> getAll() {
        return postRepository.findAll()
                .stream()
                .map(Post::of)
                .toList();
    }

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
        PostEntity found = postRepository.findById(postId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        if (!found.getProfileId().equals(profile.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        postRepository.delete(found);
    }
}
