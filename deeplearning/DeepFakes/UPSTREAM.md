# Upstream

Source project: https://github.com/yeahreum/DeepFakes.git

- Based on Siraj Raval / Yeahreum C.D.E.V faceswap work
- License: MIT (see `LICENSE`)
- Community lineage also credits [deepfakes/faceswap](https://github.com/deepfakes/faceswap)

## ElloFive packaging notes

The upstream tree ships many modules flat at the repo root, while `faceswap.py` imports:

- `lib.*`
- `scripts.*`
- `plugins.*`

ElloFive vendors the code into that package layout and adds empty `__init__.py` files so `python faceswap.py …` can resolve imports.

Local patches:
- `lib/FaceFilter.py` — fix invalid leading spaces on imports
- `lib/utils.py` — fall back to `os.scandir` on modern Python
- `requirements-ellofive.txt` — installable modern Keras/TF pins for setup script
