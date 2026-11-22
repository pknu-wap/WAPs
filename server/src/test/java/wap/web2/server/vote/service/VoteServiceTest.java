package wap.web2.server.vote.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import wap.web2.server.admin.entity.*;
import wap.web2.server.admin.repository.VoteMetaRepository;
import wap.web2.server.exception.*;
import wap.web2.server.global.security.UserPrincipal;
import wap.web2.server.member.entity.User;
import wap.web2.server.member.repository.UserRepository;
import wap.web2.server.vote.dto.*;
import wap.web2.server.vote.entity.Ballot;
import wap.web2.server.vote.repository.BallotRepository;

@ExtendWith(MockitoExtension.class)
class VoteServiceTest {
    @Mock UserRepository users;
    @Mock BallotRepository ballots;
    @Mock VoteMetaRepository metas;
    @Mock UserPrincipal principal;
    @InjectMocks VoteService service;
    private static final String TERM = "2026-02";

    private VoteMeta voting() {
        var meta = new VoteMeta(1L, TERM, VoteStatus.VOTING, 2L, null, null, null,
            false, new ArrayList<>(List.of(10L, 20L, 30L)));
        when(principal.getId()).thenReturn(5L);
        when(principal.getUserRole()).thenReturn(Optional.of("ROLE_MEMBER"));
        when(metas.findBySemesterForUpdate(TERM)).thenReturn(Optional.of(meta));
        return meta;
    }

    @Test void rejectsDuplicateNullNegativeAndWrongNumberOfProjects() {
        voting();
        List<List<Long>> invalid = Arrays.asList(null, List.of(), List.of(10L, 20L),
            List.of(10L, 20L, 30L, 40L), List.of(10L, 10L, 10L),
            Arrays.asList(10L, 20L, null), List.of(10L, 20L, -1L));
        for (var ids : invalid) {
            assertThatThrownBy(() -> service.vote(principal, new VoteRequest(ids, TERM)))
                .isInstanceOf(BadRequestException.class);
        }
        verifyNoInteractions(ballots);
    }

    @Test void rejectsAnyPreviousBallotIncludingLegacyPartialVote() {
        voting();
        when(ballots.countBallotsBySemesterAndUserId(TERM, 5L)).thenReturn(1L);
        assertThatThrownBy(() -> service.vote(principal, new VoteRequest(List.of(10L, 20L, 30L), TERM)))
            .isInstanceOf(ConflictException.class);
        verify(ballots, never()).save(any());
    }

    @Test void validatesParticipantsBeforeSavingAnyBallot() {
        voting();
        when(metas.findParticipantsByVoteMetaId(1L)).thenReturn(Set.of(10L, 20L, 30L));
        assertThatThrownBy(() -> service.vote(principal, new VoteRequest(List.of(10L, 20L, 40L), TERM)))
            .isInstanceOf(BadRequestException.class);
        verify(ballots, never()).save(any());
    }

    @Test void writesThreeDistinctBallotsAfterLockingVote() {
        voting();
        when(metas.findParticipantsByVoteMetaId(1L)).thenReturn(Set.of(10L, 20L, 30L));
        service.vote(principal, new VoteRequest(List.of(10L, 20L, 30L), TERM));
        var order = inOrder(metas, ballots);
        order.verify(metas).findBySemesterForUpdate(TERM);
        order.verify(ballots).countBallotsBySemesterAndUserId(TERM, 5L);
        var saved = ArgumentCaptor.forClass(Ballot.class);
        verify(ballots, times(3)).save(saved.capture());
        assertThat(saved.getAllValues()).extracting(Ballot::getProjectId).containsExactly(10L, 20L, 30L);
    }

    @Test void rejectsSubmissionAfterClosing() {
        voting().close(2L);
        assertThatThrownBy(() -> service.vote(principal, new VoteRequest(List.of(10L, 20L, 30L), TERM)))
            .isInstanceOf(ConflictException.class);
        verifyNoInteractions(ballots);
    }

    @Test void missingVoteIsClosedInCurrentStatusButMissingForResults() {
        User user = new User(); user.setId(5L);
        when(principal.getId()).thenReturn(5L);
        when(users.findById(5L)).thenReturn(Optional.of(user));
        assertThat(service.getVoteInfo(principal, TERM).isOpen()).isFalse();
        assertThatThrownBy(() -> service.getVoteResults(TERM)).isInstanceOf(ResourceNotFoundException.class);
    }

    @Test void publicResultsAreRecheckedAfterHidingAndReopening() {
        var meta = VoteMeta.of(TERM, 2L, Set.of(10L, 20L, 30L));
        meta.close(2L); meta.changeResultVisibility(true);
        when(metas.findBySemester(TERM)).thenReturn(Optional.of(meta));
        assertThat(service.getVoteResults(TERM)).isNotNull();
        meta.changeResultVisibility(false);
        assertThatThrownBy(() -> service.getVoteResults(TERM)).isInstanceOf(ForbiddenException.class);
        meta.changeResultVisibility(true); meta.reopen();
        assertThatThrownBy(() -> service.getVoteResults(TERM)).isInstanceOf(ForbiddenException.class);
        verify(ballots, times(1)).countVotesByProject(TERM);
    }

    @Test void latestResultsCheckVisibilityAgainAndHandleNoPublishedVote() {
        assertThatThrownBy(() -> service.getMostRecentResults()).isInstanceOf(ResourceNotFoundException.class);
        when(ballots.findPublicLatestSemester(anyString(), eq(VoteStatus.ENDED))).thenReturn(TERM);
        var meta = VoteMeta.of(TERM, 2L, Set.of(10L, 20L, 30L));
        when(metas.findBySemester(TERM)).thenReturn(Optional.of(meta));
        assertThatThrownBy(() -> service.getMostRecentResults()).isInstanceOf(ForbiddenException.class);
    }
}
