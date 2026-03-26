package so.morton.api.domain.feed;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import so.morton.api.domain.member.Member;
import so.morton.api.domain.post.Post;
import so.morton.api.domain.post.PostFinder;
import so.morton.api.domain.profile.Profile;
import so.morton.api.storage.domain.member.MemberRepository;
import so.morton.api.storage.domain.profile.ProfileRepository;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedService {

    private final PostFinder postFinder;
    private final MemberRepository memberRepository;
    private final ProfileRepository profileRepository;

    @Transactional(readOnly = true)
    public List<Feed> getAll() {

        List<Post> posts = postFinder.findAll();

        List<Long> authorIds = posts.stream().map(Post::authorId).toList();
        Map<Long, Profile> profileMap = profileRepository.findByIdIn(authorIds).stream()
                .map(Profile::of)
                .collect(Collectors.toMap(Profile::memberId, Function.identity()));

        List<Long> memberIds = profileMap.values().stream().map(Profile::memberId).toList();
        Map<Long, Member> memberMap = memberRepository.findByIdIn(memberIds).stream()
                .map(Member::of)
                .collect(Collectors.toMap(Member::id, Function.identity()));

        return posts.stream()
                .map(post -> new Feed(
                        memberMap.get(post.authorId()),
                        profileMap.get(post.authorId()),
                        post
                ))
                .toList();
    }
}
