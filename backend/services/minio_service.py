"""MinIO 文件存储服务"""
import io
import uuid
from minio import Minio
from minio.error import S3Error
from config import get_settings

settings = get_settings()

_client = None


def get_minio_client() -> Minio:
    global _client
    if _client is None:
        _client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE,
        )
        # Ensure bucket exists
        try:
            if not _client.bucket_exists(settings.MINIO_BUCKET):
                _client.make_bucket(settings.MINIO_BUCKET)
                # Set public read policy
                import json
                policy = {
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Principal": {"AWS": ["*"]},
                        "Action": ["s3:GetObject"],
                        "Resource": [f"arn:aws:s3:::{settings.MINIO_BUCKET}/*"],
                    }]
                }
                _client.set_bucket_policy(settings.MINIO_BUCKET, json.dumps(policy))
        except S3Error as e:
            print(f"MinIO bucket setup error: {e}")
    return _client


def upload_file(file_bytes: bytes, filename: str, content_type: str = "application/pdf") -> str:
    """
    上传文件到 MinIO，返回访问 URL
    """
    client = get_minio_client()
    # Generate unique object name
    ext = filename.rsplit(".", 1)[-1] if "." in filename else "pdf"
    object_name = f"{uuid.uuid4().hex}.{ext}"

    client.put_object(
        settings.MINIO_BUCKET,
        object_name,
        io.BytesIO(file_bytes),
        length=len(file_bytes),
        content_type=content_type,
    )

    # Return public URL
    protocol = "https" if settings.MINIO_SECURE else "http"
    return f"{protocol}://{settings.MINIO_ENDPOINT}/{settings.MINIO_BUCKET}/{object_name}"


def delete_file(object_name: str) -> None:
    client = get_minio_client()
    try:
        client.remove_object(settings.MINIO_BUCKET, object_name)
    except S3Error:
        pass
