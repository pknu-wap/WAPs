package wap.web2.server.storage;

public class StoragePathUtils {

    public static final String PROJECT_DIR = "projects";
    public static final String IMAGES = "images";
    public static final String THUMBNAIL = "thumbnail";

    private StoragePathUtils() {}

    public static String createUniqueFileName(
        String dirName,
        String semester,
        String projectName,
        String imageType,
        String originName
    ) {
        return (
            dirName +
            "/" +
            semester +
            "/" +
            projectName +
            "/" +
            imageType +
            "/" +
            java.util.UUID.randomUUID() +
            "_" +
            originName
        );
    }
}
