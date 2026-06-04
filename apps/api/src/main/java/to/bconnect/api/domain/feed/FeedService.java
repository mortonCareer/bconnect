package to.bconnect.api.domain.feed;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.domain.member.Member;
import to.bconnect.api.domain.member.MemberFinder;
import to.bconnect.api.domain.post.Post;
import to.bconnect.api.domain.post.PostFinder;
import to.bconnect.api.domain.profile.Profile;
import to.bconnect.api.domain.profile.ProfileFinder;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedService {

    private final PostFinder postFinder;
    private final MemberFinder memberFinder;
    private final ProfileFinder profileFinder;

    @Transactional(readOnly = true)
    public Feed get(Long postId) {
        Post post = postFinder.find(postId);
        Profile profile = profileFinder.find(post.profileId());
        Member member = memberFinder.find(profile.memberId());
        return new Feed(member, profile, post);
    }

    @Transactional(readOnly = true)
    public List<Feed> list() {

        List<Post> posts = postFinder.findAll();

        List<Long> profileIds = posts.stream().map(Post::profileId).toList();
        Map<Long, Profile> profileMap = profileFinder.findAllByIds(profileIds).stream()
                .collect(Collectors.toMap(Profile::memberId, Function.identity()));

        List<Long> memberIds = profileMap.values().stream().map(Profile::memberId).toList();
        Map<Long, Member> memberMap = memberFinder.findAllByIds(memberIds).stream()
                .collect(Collectors.toMap(Member::id, Function.identity()));

        return posts.stream()
                .map(post -> new Feed(
                        memberMap.get(post.profileId()),
                        profileMap.get(post.profileId()),
                        post
                ))
                .toList();
    }
}
