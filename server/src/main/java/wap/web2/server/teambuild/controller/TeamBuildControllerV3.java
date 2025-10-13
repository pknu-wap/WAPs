package wap.web2.server.teambuild.controller;

import jakarta.validation.Valid;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import wap.web2.server.ouath2.security.CurrentUser;
import wap.web2.server.ouath2.security.UserPrincipal;
import wap.web2.server.project.service.ProjectService;
import wap.web2.server.teambuild.dto.RecruitmentDto;
import wap.web2.server.teambuild.dto.request.ProjectAppliesRequest;
import wap.web2.server.teambuild.dto.response.ProjectAppliesResponse;
import wap.web2.server.teambuild.dto.response.RoleResponse;
import wap.web2.server.teambuild.service.ApplyService;
import wap.web2.server.teambuild.service.TeamBuildExportService;
import wap.web2.server.teambuild.service.TeamBuildService;

@RestController
@RequestMapping("/team-build")
@RequiredArgsConstructor
public class TeamBuildControllerV3 {

    private final TeamBuildExportService exportService;
    private final TeamBuildService teamBuildService;
    private final ProjectService projectService;
    private final ApplyService applyService;

    // 팀 빌딩 시 사용되는 "내 역할(팀장 or 팀원)" 반환
    @GetMapping("/role")
    public ResponseEntity<?> getMyRole(@CurrentUser UserPrincipal userPrincipal) {
        try {
            boolean isLeader = projectService.isLeader(userPrincipal.getId());
            return ResponseEntity.ok(new RoleResponse(isLeader ? "leader" : "member"));
        } catch (Exception e) {
            return ResponseEntity.status(401).body("[ERROR] 잘못된 유저입니다.");
        }
    }

    // 프로젝트 신청 (for 팀원)
    @PostMapping("/apply/submit")
    public ResponseEntity<?> apply(@CurrentUser UserPrincipal userPrincipal,
                                   @Valid @RequestBody ProjectAppliesRequest request) {
        try {
            applyService.apply(userPrincipal, request);
            return ResponseEntity.ok().body("[INFO ] 성공적으로 지원하였습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("[ERROR] 지원 실패");
        }
    }

    // 희망 팀 구성 제출 (for 팀장)
    @PostMapping("/recruit/submit")
    public ResponseEntity<?> setPreference(@CurrentUser UserPrincipal userPrincipal,
                                           @Valid @RequestBody RecruitmentDto request) {
        try {
            applyService.setPreference(userPrincipal, request);
            return ResponseEntity.ok().body("[INFO ] 성공적으로 등록하였습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("[ERROR] 등록 실패");
        }
    }

    // TODO: userPrincipal로 admin인지 권한 검사 할 수 있을듯
    // apply와 recruit이 준비되었을 때 팀 빌딩 알고리즘을 돌리는 api
    @PostMapping
    public ResponseEntity<?> makeTeam(@CurrentUser UserPrincipal userPrincipal) {
        try {
            teamBuildService.makeTeam(userPrincipal);
            return ResponseEntity.ok().body("[INFO ] 성공적으로 분배하였습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("[ERROR] 분배 실패" + e.getMessage());
        }
    }

    // 내 프로젝트에 지원한 멤버 불러오기
    @GetMapping("/{projectId}/applies")
    public ResponseEntity<?> getRecruitPageData(@CurrentUser UserPrincipal userPrincipal,
                                                @PathVariable Long projectId) {
        try {
            // 이미 모집 제출된 상태인지 검사
            boolean hasApplied = applyService.hasRecruited(userPrincipal, projectId);
            if (hasApplied) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body("[ERROR] 이미 제출된 모집이 존재합니다.");
            }

            // 프로젝트 지원자 목록 조회
            ProjectAppliesResponse response = applyService.getApplies(userPrincipal, projectId);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("[ERROR] 멤버 불러오기가 실패했습니다. " + e.getMessage());
        }
    }

    // 지원 현황 반환 (.CSV)
    @GetMapping(value = "/applies/export", produces = "text/csv; charset=UTF-8")
    public ResponseEntity<byte[]> exportAppliesCsv() {
        byte[] bytes = exportService.generateAppliesCsvBytes();

        String filename = "applies_" + LocalDate.now() + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .contentLength(bytes.length)
                .body(bytes);
    }

    // 모집 현황 반환 (.CSV)
    @GetMapping(value = "/recruits/export", produces = "text/csv; charset=UTF-8")
    public ResponseEntity<byte[]> exportRecruitsCsv() {
        byte[] bytes = exportService.generateRecruitsCsvBytes();

        String filename = "recruits_" + LocalDate.now() + ".csv";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .contentLength(bytes.length)
                .body(bytes);
    }

}
