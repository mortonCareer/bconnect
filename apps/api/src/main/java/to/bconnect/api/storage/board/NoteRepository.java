package to.bconnect.api.storage.board;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NoteRepository extends JpaRepository<NoteEntity, Long> {

    List<NoteEntity> findAllByBoardId(Long boardId);

    void deleteAllByBoardId(Long boardId);
}
