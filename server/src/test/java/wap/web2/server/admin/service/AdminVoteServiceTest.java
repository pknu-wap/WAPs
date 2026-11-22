package wap.web2.server.admin.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wap.web2.server.admin.dto.request.VoteParticipants;
import wap.web2.server.exception.BadRequestException;
import org.springframework.dao.DataIntegrityViolationException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import wap.web2.server.admin.entity.VoteMeta;
import wap.web2.server.admin.entity.VoteStatus;
import wap.web2.server.admin.repository.VoteMetaRepository;
import wap.web2.server.exception.ConflictException;
import wap.web2.server.exception.ResourceNotFoundException;
import wap.web2.server.project.repository.ProjectRepository;
import wap.web2.server.vote.repository.BallotRepository;

@ExtendWith(MockitoExtension.class)
class AdminVoteServiceTest {
    @InjectMocks AdminVoteService service;
    @Mock VoteMetaRepository metas;
    @Mock ProjectRepository projects;
    @Mock BallotRepository ballots;
    private static final String SEMESTER = "2026-02";

    @Test void openRejectsInvalidOrInsufficientParticipants() {
        for (Set<Long> ids : java.util.Arrays.<Set<Long>>asList(null, Set.of(), Set.of(1L, 2L),
            new java.util.HashSet<>(java.util.Arrays.asList(1L, 2L, null)), Set.of(1L, 2L, -3L))) {
            assertThatThrownBy(() -> service.openVote(SEMESTER, 2L, new VoteParticipants(ids)))
                .isInstanceOf(BadRequestException.class);
        }
        verifyNoInteractions(metas, projects, ballots);
    }

    @Test void openRejectsProjectsOutsideSemester() {
        var ids = Set.of(1L, 2L, 3L);
        when(projects.findExistingProjectIds(ids, SEMESTER)).thenReturn(List.of(1L, 2L));
        assertThatThrownBy(() -> service.openVote(SEMESTER, 2L, new VoteParticipants(ids)))
            .isInstanceOf(ResourceNotFoundException.class);
        verifyNoInteractions(metas, ballots);
    }

    @ParameterizedTest
    @EnumSource(value = VoteStatus.class, names = {"VOTING", "ENDED"})
    void openNeverReplacesExistingParticipants(VoteStatus status) {
        var ids = Set.of(1L, 2L, 3L);
        when(projects.findExistingProjectIds(ids, SEMESTER)).thenReturn(List.copyOf(ids));
        var meta = new VoteMeta(1L, SEMESTER, status, 2L, null, null, null, false, new ArrayList<>(List.of(10L)));
        when(metas.findBySemester(SEMESTER)).thenReturn(Optional.of(meta));
        assertThatThrownBy(() -> service.openVote(SEMESTER, 2L, new VoteParticipants(ids)))
            .isInstanceOf(ConflictException.class);
        assertThat(meta.getParticipants()).containsExactly(10L);
        assertThat(meta.getStatus()).isEqualTo(status);
        verify(metas, never()).saveAndFlush(any());
    }

    @Test void concurrentCreationConflictIsNotInternalServerError() {
        var ids = Set.of(1L, 2L, 3L);
        when(projects.findExistingProjectIds(ids, SEMESTER)).thenReturn(List.copyOf(ids));
        when(metas.saveAndFlush(any())).thenThrow(new DataIntegrityViolationException("duplicate semester"));
        assertThatThrownBy(() -> service.openVote(SEMESTER, 2L, new VoteParticipants(ids)))
            .isInstanceOf(ConflictException.class);
    }

    @Test void closeHidesResultsAndRepeatedClosePreservesAudit() {
        var meta = new VoteMeta(1L, SEMESTER, VoteStatus.VOTING, 2L, null, null, null, true, new ArrayList<>());
        when(metas.findBySemesterForUpdate(SEMESTER)).thenReturn(Optional.of(meta));
        service.closeVote(SEMESTER, 3L);
        assertThat(meta.isResultPublic()).isFalse();
        var closedAt = meta.getClosedAt();
        assertThatThrownBy(() -> service.closeVote(SEMESTER, 4L)).isInstanceOf(ConflictException.class);
        assertThat(meta.getClosedBy()).isEqualTo(3L);
        assertThat(meta.getClosedAt()).isEqualTo(closedAt);
    }

    @Test void visibilityRequiresExistingVoteAndOnlyEndedVotesCanBePublished() {
        assertThatThrownBy(() -> service.changeResultStatus(SEMESTER, true)).isInstanceOf(ResourceNotFoundException.class);
        var meta = VoteMeta.of(SEMESTER, 2L, Set.of(1L, 2L, 3L));
        when(metas.findBySemesterForUpdate(SEMESTER)).thenReturn(Optional.of(meta));
        assertThatThrownBy(() -> service.changeResultStatus(SEMESTER, true)).isInstanceOf(ConflictException.class);
        service.changeResultStatus(SEMESTER, false);
        meta.close(2L);
        service.changeResultStatus(SEMESTER, true);
        assertThat(meta.isResultPublic()).isTrue();
    }

    @Test void deleteRemovesBallotsBeforeMetadataAndLeavesProjectsAlone() {
        var meta = VoteMeta.of(SEMESTER, 2L, Set.of(10L, 20L, 30L));
        meta.close(2L);
        when(metas.findBySemesterForUpdate(SEMESTER)).thenReturn(Optional.of(meta));
        service.deleteVote(SEMESTER);
        var order = inOrder(metas, ballots);
        order.verify(metas).findBySemesterForUpdate(SEMESTER);
        order.verify(ballots).deleteBySemester(SEMESTER);
        order.verify(metas).delete(meta);
        verifyNoInteractions(projects);
    }

    @ParameterizedTest
    @EnumSource(value = VoteStatus.class, names = {"NOT_CREATED", "VOTING"})
    void rejectsVotesThatHaveNotEnded(VoteStatus status) {
        var meta = new VoteMeta(1L, SEMESTER, status, 2L, null, null, null, false, new ArrayList<>());
        when(metas.findBySemesterForUpdate(SEMESTER)).thenReturn(Optional.of(meta));
        assertThatThrownBy(() -> service.deleteVote(SEMESTER)).isInstanceOf(ConflictException.class);
        assertThat(meta.getStatus()).isEqualTo(status);
        verifyNoInteractions(ballots, projects);
    }

    @Test void rejectsMissingVote() {
        when(metas.findBySemesterForUpdate(SEMESTER)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.deleteVote(SEMESTER)).isInstanceOf(ResourceNotFoundException.class);
        verifyNoInteractions(ballots, projects);
    }
}
