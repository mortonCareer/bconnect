package to.bconnect.api.core.domain.post;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.core.domain.attachment.AttachmentQueryService;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.post.PostAttachmentMappingEntity;
import to.bconnect.api.storage.post.PostAttachmentMappingRepository;
import to.bconnect.api.storage.post.PostEntity;
import to.bconnect.api.storage.post.PostRepository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final PostAttachmentMappingRepository postAttachmentMappingRepository;
    private final AttachmentQueryService attachmentQueryService;

    @Transactional(readOnly = true)
    public List<Post> list() {
        List<PostEntity> posts = postRepository.findAll();

        List<Long> postIds = posts.stream().map(PostEntity::getId).toList();
        Map<Long, List<Long>> attachmentIdMap = postAttachmentMappingRepository.findByPostIdIn(postIds)
                .stream()
                .collect(Collectors.groupingBy(
                        PostAttachmentMappingEntity::getPostId,
                        Collectors.mapping(PostAttachmentMappingEntity::getAttachmentId, Collectors.toList())
                ));

        return posts.stream()
                .map(it -> Post.of(it, attachmentIdMap.getOrDefault(it.getId(), List.of())))
                .toList();
    }

    @Transactional(readOnly = true)
    public Post get(Long postId) {
        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        List<Long> attachmentIds = postAttachmentMappingRepository.findByPostIdIn(List.of(postId))
                .stream()
                .map(PostAttachmentMappingEntity::getAttachmentId)
                .toList();

        return Post.of(post, attachmentIds);
    }

    @Transactional
    public Long create(AuthUser user, CreatePost command) {
        attachmentQueryService.list(user, command.attachmentIds());

        PostEntity created = postRepository.save(new PostEntity(
                user.id(),
                command.taskId(),
                command.content()
        ));

        postAttachmentMappingRepository.saveAll(command.attachmentIds().stream()
                .map(it -> new PostAttachmentMappingEntity(created.getId(), it))
                .toList());

        return created.getId();
    }

    @Transactional
    public void update(AuthUser user, Long postId, String content) {
        PostEntity found = postRepository.findById(postId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getMemberId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.update(content);
    }

    @Transactional
    public void delete(AuthUser user, Long postId) {
        postRepository.findById(postId).ifPresent(it -> {
            if (!it.getMemberId().equals(user.id()))
                throw new CodeException(CommonExceptionCode.FORBIDDEN);

            postAttachmentMappingRepository.deleteByPostId(it.getId());
            postRepository.delete(it);
        });
    }
}
