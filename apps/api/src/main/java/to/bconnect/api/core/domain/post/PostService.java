package to.bconnect.api.core.domain.post;

import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import to.bconnect.api.common.CodeException;
import to.bconnect.api.common.CommonExceptionCode;
import to.bconnect.api.attachment.AttachmentLinker;
import to.bconnect.api.security.AuthUser;
import to.bconnect.api.storage.attachment.ReferenceType;
import to.bconnect.api.storage.post.PostEntity;
import to.bconnect.api.storage.post.PostRepository;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final AttachmentLinker attachmentLinker;

    @Transactional(readOnly = true)
    public List<Post> list() {
        return postRepository.findAll().stream()
                .map(Post::of)
                .toList();
    }

    @Transactional(readOnly = true)
    public Post get(Long postId) {
        return postRepository.findById(postId)
                .map(Post::of)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));
    }

    @Transactional
    public Long create(AuthUser user, CreatePost command) {
        val created = postRepository.save(new PostEntity(
                user.id(),
                command.taskId(),
                command.content()
        ));

        attachmentLinker.link(user.id(), ReferenceType.POST, created.getId(), command.attachmentIds());

        return created.getId();
    }

    @Transactional
    public void update(AuthUser user, Long postId, String content) {
        val found = postRepository.findById(postId)
                .orElseThrow(() -> new CodeException(CommonExceptionCode.NOT_FOUND));

        if (!found.getMemberId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        found.update(content);
    }

    @Transactional
    public void delete(AuthUser user, Long postId) {
        val optional = postRepository.findById(postId);
        if (optional.isEmpty())
            return;
        val found = optional.get();

        if (!found.getMemberId().equals(user.id()))
            throw new CodeException(CommonExceptionCode.FORBIDDEN);

        attachmentLinker.unlink(ReferenceType.POST, List.of(found.getId()));
        postRepository.delete(found);
    }
}
