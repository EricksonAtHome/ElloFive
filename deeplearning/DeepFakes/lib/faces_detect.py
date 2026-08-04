# Face detection with graceful fallbacks for ElloFive.
# Prefers face_recognition/dlib; falls back to OpenCV Haar cascades.

from collections import namedtuple

DetectedFace = namedtuple("DetectedFace", "image x y w h landmarks")


def detect_faces(frame):
    """Yield DetectedFace objects found in an image/frame (BGR or RGB array)."""
    detectors = (_detect_face_recognition, _detect_opencv_haar)
    last_error = None
    for detector in detectors:
        try:
            faces = list(detector(frame))
            if faces:
                return faces
            # detector worked but found nothing — still valid
            if detector is _detect_face_recognition:
                return faces
        except Exception as exc:  # noqa: BLE001 - intentional fallback chain
            last_error = exc
            continue
    if last_error:
        raise RuntimeError(
            "No face detector available. Install face_recognition or ensure OpenCV data files exist."
        ) from last_error
    return []


def _detect_face_recognition(frame):
    import face_recognition

    # face_recognition expects RGB
    rgb = frame[:, :, ::-1] if frame.shape[-1] == 3 else frame
    locations = face_recognition.face_locations(rgb)
    landmarks_list = face_recognition.face_landmarks(rgb, locations)
    for (top, right, bottom, left), landmarks in zip(locations, landmarks_list):
        x, y = left, top
        w, h = right - left, bottom - top
        yield DetectedFace(
            image=frame[y : y + h, x : x + w],
            x=x,
            y=y,
            w=w,
            h=h,
            landmarks=landmarks,
        )


def _detect_opencv_haar(frame):
    import cv2
    import os

    cascade_path = os.path.join(
        cv2.data.haarcascades, "haarcascade_frontalface_default.xml"
    )
    cascade = cv2.CascadeClassifier(cascade_path)
    if cascade.empty():
        raise RuntimeError("OpenCV Haar cascade failed to load")

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) if len(frame.shape) == 3 else frame
    boxes = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(48, 48))
    for (x, y, w, h) in boxes:
        yield DetectedFace(
            image=frame[y : y + h, x : x + w],
            x=int(x),
            y=int(y),
            w=int(w),
            h=int(h),
            landmarks=None,
        )
