package wap.web2.server.admin.controller;

import io.swagger.v3.oas.annotations.Operation;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import wap.web2.server.admin.service.AdminTeamBuildingService;
import wap.web2.server.admin.service.TeamBuildExportService;

@RestController
@RequestMapping("/admin/team")
@RequiredArgsConstructor
public class AdminTeamBuildingController {

    private final TeamBuildExportService exportService;
    private final AdminTeamBuildingService adminTeamBuildingService;

    // apply와 recruit이 준비되었을 때 팀 빌딩 알고리즘 실행 트리거
    @PostMapping("/building")
    @Operation(summary = "팀 생성하기", description = "팀 지원과 팀원 모집이 완료되면 팀을 생성합니다.")
    public ResponseEntity<?> makeTeam() {
        try {
            adminTeamBuildingService.makeTeam();
            return ResponseEntity.ok().body("[INFO ] 성공적으로 분배하였습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("[ERROR] 분배 실패" + e.getMessage());
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
