# ElloFive Deep Learning

This folder adds **deep learning** capabilities to ElloFive via [yeahreum/DeepFakes](https://github.com/yeahreum/DeepFakes) (faceswap / autoencoder face models, MIT).

| Path | Role |
| --- | --- |
| `DeepFakes/` | Vendored DeepFakes toolkit (organized into `lib/`, `scripts/`, `plugins/`) |
| `../scripts/setup-deepfakes.sh` | Create an isolated Python venv for DeepFakes deps |
| `ellofive dl` | CLI bridge from ElloFive into DeepFakes |

## Responsible use

Use only with **consenting** subjects and lawful content (research, education, consented VFX). Do **not** create non-consensual or deceptive media of real people.

## Quick start

```bash
# from repo root
bash scripts/setup-deepfakes.sh

# help / status
ellofive dl
ellofive dl status

# DeepFakes faceswap entrypoint (after venv setup)
ellofive dl extract -h
ellofive dl train -h
ellofive dl convert -h
```

Upstream docs: [`DeepFakes/INSTALL.md`](DeepFakes/INSTALL.md), [`DeepFakes/USAGE.md`](DeepFakes/USAGE.md).

## How it fits ElloFive

- **ElloFive / Ollama** → local LLM chat + FRC7 FRCL
- **DeepFakes** → classic deep-learning CV (Keras/TensorFlow face autoencoders)

Ask the LLM about the stack:

```bash
ellofive run ellofive "Explain how ElloFive deep learning DeepFakes extract/train/convert works."
```
