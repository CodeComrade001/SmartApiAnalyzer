#!/usr/bin/env bash

set -u

# ============================================================
# PROJECT PATHS
# ============================================================

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPILER_ROOT="$PROJECT_ROOT/compiler-services"

echo "======================================"
echo " Installing Dependencies"
echo "======================================"
echo "Project:   $PROJECT_ROOT"
echo "Compilers: $COMPILER_ROOT"
echo "======================================"
echo ""

# ============================================================
# DIRECTORIES USED BY "ALL"
# ============================================================

DIRECTORIES=(
    "csharp"
    "go"
    "Java"
    "js_ts"
    "python"
    "rust"
)

# ============================================================
# MANUALLY DEFINE INSTALLATIONS
#
# Format:
#
#   "directory|command"
#
# Specific directory:
#
#   "js_ts|pnpm add mongoose"
#
# ALL directories:
#
#   "ALL|pnpm add mongoose"
#
# ============================================================

DEPENDENCIES=(

    # Specific directory
    # "js_ts|pnpm add mongoose"

    # Example:
    # "js_ts|pnpm add fastify @fastify/cors"
    # "js_ts|pnpm add -D typescript tsx"

    # All directories
    "ALL|pnpm add mongoose"

)

# ============================================================
# RUN COMMAND
# ============================================================

run_command() {

    local FOLDER="$1"
    local COMMAND="$2"

    local SERVICE_DIR="$COMPILER_ROOT/$FOLDER"

    if [ ! -d "$SERVICE_DIR" ]; then
        echo ""
        echo "[$FOLDER] ERROR"
        echo "Directory does not exist:"
        echo "$SERVICE_DIR"
        echo ""
        return 1
    fi

    echo ""
    echo "============================================================"
    echo "[$FOLDER] STARTING"
    echo "============================================================"
    echo "Directory:"
    echo "  $SERVICE_DIR"
    echo ""
    echo "Command:"
    echo "  $COMMAND"
    echo ""
    echo "------------------------------------------------------------"

    (
        cd "$SERVICE_DIR" || exit 1

        # Execute the command and keep stdout/stderr visible.
        bash -c "$COMMAND"

    )

    local EXIT_CODE=$?

    echo ""
    echo "------------------------------------------------------------"

    if [ "$EXIT_CODE" -eq 0 ]; then
        echo "[$FOLDER] SUCCESS"
    else
        echo "[$FOLDER] FAILED"
        echo "[$FOLDER] Exit code: $EXIT_CODE"
    fi

    echo "============================================================"
    echo ""

    return "$EXIT_CODE"
}

# ============================================================
# PARALLEL EXECUTION
# ============================================================

PIDS=()
NAMES=()

for DEPENDENCY in "${DEPENDENCIES[@]}"; do

    TARGET="${DEPENDENCY%%|*}"
    COMMAND="${DEPENDENCY#*|}"

    # --------------------------------------------------------
    # ALL DIRECTORIES
    # --------------------------------------------------------

    if [ "$TARGET" = "ALL" ]; then

        for FOLDER in "${DIRECTORIES[@]}"; do

            (
                run_command "$FOLDER" "$COMMAND"
            ) &

            PIDS+=($!)
            NAMES+=("$FOLDER")

        done

    # --------------------------------------------------------
    # SPECIFIC DIRECTORY
    # --------------------------------------------------------

    else

        (
            run_command "$TARGET" "$COMMAND"
        ) &

        PIDS+=($!)
        NAMES+=("$TARGET")

    fi

done

# ============================================================
# NOTHING TO RUN
# ============================================================

if [ "${#PIDS[@]}" -eq 0 ]; then

    echo ""
    echo "No dependency commands configured."
    echo ""
    echo "Edit the DEPENDENCIES array in this script."
    echo ""

    exit 0
fi

echo ""
echo "======================================"
echo " Installations running in parallel"
echo "======================================"
echo ""

# ============================================================
# WAIT FOR EVERYTHING
# ============================================================

FAILURES=0

for i in "${!PIDS[@]}"; do

    if wait "${PIDS[$i]}"; then
        :
    else
        FAILURES=$((FAILURES + 1))
    fi

done

# ============================================================
# FINAL RESULT
# ============================================================

echo ""
echo "======================================"
echo " Installation Summary"
echo "======================================"

if [ "$FAILURES" -eq 0 ]; then

    echo "All dependency operations completed successfully."

else

    echo "$FAILURES dependency operation(s) failed."

fi

echo "======================================"
echo ""

exit "$FAILURES"

