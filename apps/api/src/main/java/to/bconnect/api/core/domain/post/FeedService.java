package to.bconnect.api.core.domain.post;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.storage.post.PostRepository;
import to.bconnect.api.security.member.Member;
import to.bconnect.api.security.member.MemberFinder;
import to.bconnect.api.core.domain.profile.Profile;
import to.bconnect.api.core.domain.profile.ProfileFinder;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedService {

    private final PostRepository postRepository;
    private final MemberFinder memberFinder;
    private final ProfileFinder profileFinder;

    @Transactional(readOnly = true)
    public List<Feed> list() {
        List<Post> posts =  postRepository.findAll()
                .stream()
                .map(Post::of)
                .toList();

        List<Long> profileIds = posts.stream().map(Post::profileId).toList();

        Map<Long, Profile> profileById = profileFinder.findAllByIds(profileIds).stream()
                .collect(Collectors.toMap(Profile::memberId, Function.identity()));

        List<Long> memberIds = profileById.values().stream().map(Profile::memberId).toList();

        Map<Long, Member> memberById = memberFinder.findAllByIds(memberIds).stream()
                .collect(Collectors.toMap(Member::id, Function.identity()));

        return posts.stream()
                .map(post -> new Feed(
                        memberById.get(post.profileId()),
                        profileById.get(post.profileId()),
                        post
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public Feed get(Long postId) {
        Post post = postRepository.findById(postId)
                .map(Post::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
        Profile profile = profileFinder.find(post.profileId());
        Member member = memberFinder.find(profile.memberId());
        return new Feed(member, profile, post);
    }

}
