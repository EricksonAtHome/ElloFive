# ElloFive local knowledge base
# Append notes with: ellofive memory add "note"
# Shown to the model during `ellofive chat` / `ellofive ask`

## Preferences
- Prefer production-ready code, tests, and security by default.
- Privacy-first / offline local runtime.

## Architecture decisions
- Runtime: Ollama wrapped as ElloFive
- Orchestration: FRC7 FRCL (`ellofive frc`)
- Deep learning: yeahreum/DeepFakes (`ellofive dl`)

## Successful patterns
- Rebuild models: `ellofive setup`
- Quality chat: `ellofive chat`
- Fast chat: `ellofive fast`
- FRCL hello: `ellofive frc examples/hello.frcl`
- DeepFakes smoke: `ellofive dl smoke`
- 2026-08-05T13:14:12Z — Prefer explicit type hints and tests for all Python helpers
