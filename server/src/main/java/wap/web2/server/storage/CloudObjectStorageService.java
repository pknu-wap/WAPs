package wap.web2.server.storage;

/** Raw provider operations, wrapped by the shared-image storage service. */
public interface CloudObjectStorageService extends ObjectStorageService {
    boolean exists(String imageUrl);
}
