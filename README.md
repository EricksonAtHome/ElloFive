# ElloFive

**ElloFive** is your own local LLM runtime. It installs [Ollama](https://ollama.com), brands the CLI as `ellofive`, runs real inference for [FRC7](https://github.com/EricksonAtHome/FRC7) FRCL scripts, and includes deep learning via [yeahreum/DeepFakes](https://github.com/yeahreum/DeepFakes).

## Test demo

Live run of `ellofive version`, model list, chat, and FRC7 FRCL scripts (`hello.frcl` + `models5.frcl`):

[![ElloFive test demo](docs/ellofive-test-demo.gif)](docs/ellofive-test-demo.mp4)

[Watch full demo (MP4)](docs/ellofive-test-demo.mp4) · [Raw video](https://github.com/EricksonAtHome/ElloFive/raw/main/docs/ellofive-test-demo.mp4)

## What you get

| Piece | Purpose |
| --- | --- |
| `ellofive` CLI | Ollama, renamed and wrapped for ElloFive |
| `ellofive` model | Your custom LLM (system prompt + params on `llama3.2:1b`) |
| `models5` model | FRC7-compatible alias used by FRC demos |
| `frc/` | FRCL parser + executor that calls ElloFive instead of stub strings |
| `examples/*.frcl` | FRC7-style scripts ready to run locally |
| `deeplearning/DeepFakes` | Deep learning faceswap toolkit from [yeahreum/DeepFakes](https://github.com/yeahreum/DeepFakes) |

## Quick start

```bash
# 1) Install Ollama + ElloFive CLI
bash scripts/install.sh

# 2) Start the runtime (separate terminal if needed)
ellofive serve

# 3) Build your LLM + FRC7 alias
ellofive setup
# or: npm run setup

# 4) Chat
ellofive run ellofive

# 5) Run FRC7 FRCL against your LLM
ellofive frc examples/hello.frcl
ellofive frc examples/frc7-demo.frcl
```

## Test

```bash
npm install
npm test
```

## Deep learning (DeepFakes)

ElloFive vendors [yeahreum/DeepFakes](https://github.com/yeahreum/DeepFakes.git) under `deeplearning/DeepFakes` (Keras/TensorFlow face autoencoders: extract → train → convert).

```bash
# create isolated Python venv for DeepFakes deps
ellofive dl setup
# or: npm run setup:deepfakes

ellofive dl status
ellofive dl extract -h
ellofive dl train -h
ellofive dl convert -h
```

Use only with **consenting** subjects and lawful content. Details: [`deeplearning/README.md`](deeplearning/README.md).

## FRC7 API bridge

Start a small Express API that mirrors FRC7-style `POST /run/:model`:

```bash
npm run api
curl -s -X POST http://127.0.0.1:3000/run/models5 \
  -H 'Content-Type: application/json' \
  -d '{"input":"Hello from ElloFive"}'
```

## Customize your LLM

Edit `models/Modelfile`, then recreate:

```bash
ellofive create ellofive -f models/Modelfile
# optional stronger base model:
ELLOFIVE_BASE_MODEL=llama3.2:3b ellofive setup
```

## Project layout

```
bin/ellofive           # branded CLI
bin/ellofive-dl        # deep learning bridge
models/Modelfile       # your ElloFive LLM definition
models/Modelfile.models5
frc/                   # FRC7 FRCL → ElloFive executor + API
deeplearning/DeepFakes # yeahreum/DeepFakes deep learning toolkit
examples/              # sample .frcl scripts
docs/                  # test demo video + GIF
scripts/install.sh
scripts/setup-model.sh
scripts/setup-deepfakes.sh
scripts/test-ellofive.sh
```

## Credits

- Runtime engine: [Ollama](https://ollama.com)
- FRCL / distributed AI patterns: [EricksonAtHome/FRC7](https://github.com/EricksonAtHome/FRC7)
- Deep learning faceswap: [yeahreum/DeepFakes](https://github.com/yeahreum/DeepFakes) (MIT)
