package wap.web2.server.teambuild.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import wap.web2.server.ouath2.security.CurrentUser;
import wap.web2.server.ouath2.security.UserPrincipal;
import wap.web2.server.teambuild.dto.RecruitmentDto;
import wap.web2.server.teambuild.dto.request.ProjectAppliesRequest;
import wap.web2.server.teambuild.dto.response.ProjectAppliesResponse;
import wap.web2.server.teambuild.service.ApplyService;

@RestController
@RequestMapping("/team-build")
@RequiredArgsConstructor
public class TeamBuildController {

    private final ApplyService applyService;

    // 프로젝트 신청 (for 팀원)
    @PostMapping("/apply")
    public ResponseEntity<?> apply(@CurrentUser UserPrincipal userPrincipal,
                                   @Valid @RequestBody ProjectAppliesRequest request) {
        try {
            applyService.apply(userPrincipal, request);
            return ResponseEntity.ok().body("[INFO ] 성공적으로 지원하였습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("[ERROR] 지원 실패");
        }
    }

    // 프로젝트에 신청한 사람 보기 (for 팀장)
    @GetMapping("{projectId}/applies")
    public ResponseEntity<?> getApplies(@CurrentUser UserPrincipal userPrincipal,
                                        @PathVariable("projectId") Long projectId) {
        try {
            ProjectAppliesResponse response = applyService.getApplies(userPrincipal, projectId);
            return ResponseEntity.ok().body(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/preference")
    public ResponseEntity<?> setPreference(@CurrentUser UserPrincipal userPrincipal,
                                           @Valid @RequestBody RecruitmentDto request) {
        try {
            applyService.setPreference(userPrincipal, request);
            return ResponseEntity.ok().body("[INFO ] 성공적으로 등록하였습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("[ERROR] 등록 실패" + e.getMessage());
        }
    }

}
