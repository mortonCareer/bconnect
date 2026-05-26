package so.morton.api.domain.feed;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import so.morton.api.domain.member.Member;
import so.morton.api.domain.member.MemberFinder;
import so.morton.api.domain.post.Post;
import so.morton.api.domain.post.PostFinder;
import so.morton.api.domain.profile.Profile;
import so.morton.api.domain.profile.ProfileFinder;

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
    public List<Feed> getAll() {

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
