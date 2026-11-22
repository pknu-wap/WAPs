-- Only newly uploaded files are registered; existing object URLs are unchanged.
CREATE TABLE shared_image_storage_lock (
    id INT NOT NULL PRIMARY KEY
);
INSERT INTO shared_image_storage_lock (id) VALUES (1);

CREATE TABLE shared_image_storage (
    sha256 CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
    image_url VARCHAR(2048) NOT NULL
);
