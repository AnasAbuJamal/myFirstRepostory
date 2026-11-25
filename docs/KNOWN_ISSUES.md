# LumenVale Known Issues & Workarounds

1. **Unreal Engine MCP Connection Closed After Template Level Duplication**: Duplicating `Lvl_IntroRoom` and deleting template actors inside a single `ProgrammaticToolset` script triggered a `PythonScriptPlugin` exit; Unreal Editor restarted (`EduGame - Unreal Editor`), requiring Web MCP Bridge reconnection to the new Unreal MCP session. **Fix Applied**: Authored `EduGame/Content/Python/build_lumenvale_city.py` using `LevelEditorSubsystem.new_level()`.
2. **Blender MCP Addon Offline (`localhost:9876`)**: Used installed Blender 5.3 CLI (`blender.exe --background --python`) for deterministic FBX generation.
3. **Shrimp Task Manager `split_tasks` Persistence**: Returned empty task list without persisting; persistent task tracking is maintained in `docs/TASKS.md`, `docs/PROJECT_PLAN.md`, and `docs/PROGRESS.md`.
