package so.morton.api.domain.post;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import so.morton.api.api.controller.v1.request.CreatePostRequest;
import so.morton.api.api.controller.v1.request.UpdatePostRequest;
import so.morton.api.domain.profile.Profile;
import so.morton.api.domain.profile.ProfileFinder;
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

    @Transactional
    public Post create(Long memberId, CreatePostRequest request) {
        Profile profile = profileFinder.getByMemberId(memberId);
        PostEntity post = PostEntity.builder()
                .authorId(profile.id())
                .taskId(request.taskId())
                .images(request.images())
                .content(request.content())
                .build();

        PostEntity saved = postRepository.save(post);
        return Post.of(saved);
    }

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
    public void update(Long postId, Long memberId, UpdatePostRequest request) {
        Profile profile = profileFinder.getByMemberId(memberId);
        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        if (!post.getAuthorId().equals(profile.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        post.update(request.content());
    }

    @Transactional
    public void delete(Long postId, Long memberId) {
        Profile profile = profileFinder.getByMemberId(memberId);
        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        if (!post.getAuthorId().equals(profile.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        postRepository.delete(post);
    }
}
