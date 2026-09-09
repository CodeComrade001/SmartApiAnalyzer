#!/usr/bin/env bash

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting compiler services..."

code --reuse-window --command workbench.action.terminal.new

services=(
    "csharp"
    "go"
    "Java"
    "js_ts"
    "python"
    "rust"
)

commands=(
    "dotnet run"
    "go run ."
    "mvn spring-boot:run"
    "pnpm dev"
    "python main.py"
    "cargo run"
)

for i in "${!services[@]}"; do
    SERVICE="${services[$i]}"
    COMMAND="${commands[$i]}"

    (
        cd "$ROOT_DIR/$SERVICE"

        echo "Starting $SERVICE..."
        code --reuse-window --command workbench.action.terminal.new

        sleep 1

        code --reuse-window --command workbench.action.terminal.focus

        echo "[$SERVICE] $COMMAND"
    )
done

echo "All terminals created."