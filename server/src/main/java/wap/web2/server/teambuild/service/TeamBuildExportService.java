package wap.web2.server.teambuild.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import wap.web2.server.teambuild.entity.ProjectApply;
import wap.web2.server.teambuild.repository.ProjectApplyRepository;

@Service
@RequiredArgsConstructor
public class TeamBuildExportService {

    private final ProjectApplyRepository applyRepository;
    
    /**
     * 지원현황 CSV(UTF-8 with BOM) 전체를 메모리에서 만들어 byte[]로 반환
     */
    public byte[] generateAppliesCsvBytes() {
        ByteArrayOutputStream baos = new ByteArrayOutputStream(64 * 1024);

        try (OutputStreamWriter w = new OutputStreamWriter(baos, StandardCharsets.UTF_8);
             CSVPrinter csv = new CSVPrinter(w, CSVFormat.DEFAULT)) {

            // Excel 호환을 위한 BOM
            w.write('\uFEFF');

            // 헤더
            csv.printRecord("applyId", "userId", "projectId", "position", "priority", "semester");

            // 페이지 단위로 전체 덤프
            int page = 0;
            Page<ProjectApply> p;
            do {
                p = applyRepository.findAll(PageRequest.of(page++, 1000));
                for (ProjectApply a : p.getContent()) {
                    csv.printRecord(
                            a.getId(),
                            a.getUser().getId(),
                            a.getProject().getProjectId(),
                            a.getPosition(),     // Enum -> name()
                            a.getPriority(),
                            a.getSemester()
                    );
                }
                csv.flush(); // 메모리로만 flush (응답은 아직 미커밋)
            } while (!p.isLast());

        } catch (IOException e) {
            // 메모리 스트림이라 거의 안 나지만, 발생 시 래핑
            throw new RuntimeException("CSV 생성 중 오류", e);
        }

        return baos.toByteArray();
    }

}
