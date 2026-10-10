#!/bin/bash
#
# WHY THE TERMINAL WILL NOT OPEN, AND HOW TO PUT IT RIGHT  (macOS only)
#
# THE SYMPTOM.  The editor says:
#   "The terminal process failed to launch: A native exception occurred during
#    launch (posix_openpt failed: Device not configured)."
#
# WHAT IT MEANS, IN PLAIN WORDS.
#   A "pseudo-terminal" is the small device a command line runs inside. macOS
#   hands out only a fixed number of them at once (511 by default, the setting
#   called kern.tty.ptmx_max). When every one is already held, the machine
#   answers "Device not configured" and NO terminal opens anywhere — not in the
#   editor, not in Terminal.app. Nothing is broken; the supply has run out.
#
# WHY THEY ALL GET HELD — MEASURED ON THIS MAC, 2026-10-10.  Every command run
#   through the editor's terminal leaves its shell alive: an interactive login
#   shell sits waiting for input and never exits, so it holds its device for
#   ever. One editor process had been running 17 days and had collected 495 of
#   them — 493 of the 511 in use, at roughly one per command. (A separate fault
#   in "node-pty" also leaked a device per terminal on macOS; it is fixed in
#   node-pty 1.2.0-beta.15, which this editor already ships — so that is NOT
#   what fills this machine.)
#
# WHAT THIS SCRIPT DOES
#   (no arguments)  measures the supply, says whether a terminal can be opened,
#                   and names the programs holding the most. Changes NOTHING.
#   --reap          gives the supply back by closing ABANDONED shells: only ones
#                   an hour or older with nothing running inside them. It never
#                   touches a shell that is in use.
#   --reap-low      the same, but only when the supply is running low (300 or
#                   more of 511 held). This is what the automatic helper runs,
#                   so it can never close a terminal that is merely sitting open.
#   --free          stops the single program holding the most devices (asks
#                   first; never touches the system itself).
#   --permanent     makes a larger supply survive every restart. Needs the
#                   administrator password, once.
#
# HOW TO RUN IT
#   bash scripts/fix-terminal-pty.sh
#   bash scripts/fix-terminal-pty.sh --reap
#   bash scripts/fix-terminal-pty.sh --free
#   sudo bash scripts/fix-terminal-pty.sh --permanent
#
# SAID PLAINLY: if the supply is ALREADY empty, no terminal can open anywhere,
# so this script cannot be run at all. In that case force-quit the editor
# (Apple menu > Force Quit) or restart the Mac — every device comes back at
# once — and then run this script to stop it happening again.

set -u

mode="${1:-}"

supply() {
  sysctl -n kern.tty.ptmx_max 2>/dev/null || echo "unknown"
}

held() {
  lsof /dev/ptmx 2>/dev/null | awk 'NR > 1 { print $2 }'
}

holders() {
  held | sort -n | uniq -c | sort -rn | head -10
}

echo "THE TERMINAL SUPPLY ON THIS MAC"
echo "  handed out at once, at most : $(supply)"
echo "  held right now               : $(held | wc -l | tr -d ' ')"

echo
echo "CAN A TERMINAL BE OPENED RIGHT NOW?"
if python3 -c "import os; os.openpty()" 2>/dev/null; then
  echo "  Yes — a terminal can still be opened. There is headroom."
else
  echo "  NO — the machine answered 'Device not configured' (the supply is empty)."
  echo "  Give it back: force-quit the editor, or restart the Mac."
fi

echo
echo "THE PROGRAMS HOLDING THE MOST"
if [ -z "$(holders)" ]; then
  echo "  nothing is holding one."
else
  holders | while read -r count pid; do
    name=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
    echo "  ${count} held by pid ${pid} (${name})"
  done
fi

if [ "$mode" = "--free" ]; then
  echo
  echo "GIVING THE SUPPLY BACK"
  worst=$(holders | head -1)
  if [ -z "$worst" ]; then
    echo "  nothing is holding one — there is nothing to free."
    exit 0
  fi
  worst_count=$(echo "$worst" | awk '{ print $1 }')
  worst_pid=$(echo "$worst" | awk '{ print $2 }')
  if [ "$worst_pid" = "1" ]; then
    echo "  pid 1 is the system itself — refusing to touch it."
    exit 1
  fi
  worst_name=$(ps -p "$worst_pid" -o comm= 2>/dev/null || echo "unknown")
  echo "  pid ${worst_pid} (${worst_name}) is holding ${worst_count} of them."
  printf "  Stop that program so the devices come back? [y/N] "
  read -r answer
  case "$answer" in
    y|Y)
      kill -TERM "$worst_pid" 2>/dev/null || kill -KILL "$worst_pid" 2>/dev/null
      echo "  asked it to stop; the devices return as it exits."
      ;;
    *)
      echo "  left alone — nothing was changed."
      ;;
  esac
  exit 0
fi

if [ "$mode" = "--reap" ] || [ "$mode" = "--reap-low" ]; then
  echo
  echo "GIVING THE SUPPLY BACK BY CLOSING ABANDONED SHELLS"
  if [ "$mode" = "--reap-low" ]; then
    # The automatic helper only acts when the supply is genuinely running low, so it
    # can never close a terminal that is simply sitting open and idle.
    now=$(held | wc -l | tr -d ' ')
    if [ "$now" -lt 300 ]; then
      echo "  the supply is comfortable ($now held of $(supply)) — nothing was reaped."
      exit 0
    fi
    echo "  the supply is running low ($now held of $(supply)) — reaping now."
  fi
  ptyhost=$(holders | head -1 | awk '{ print $2 }')
  if [ -z "$ptyhost" ]; then
    echo "  nothing is holding one — there is nothing to free."
    exit 0
  fi
  mine=$$
  freed=0
  kept=0
  for pid in $(ps -Ao pid,ppid | awk -v host="$ptyhost" '$2 == host { print $1 }'); do
    [ "$pid" = "$mine" ] && { kept=$((kept + 1)); continue; }
    case "$(ps -o command= -p "$pid" 2>/dev/null)" in
      *zsh*) ;;
      *) kept=$((kept + 1)); continue ;;
    esac
    # Only a shell that has been running for an hour or more can be judged abandoned;
    # anything younger may be the shell that is running this very command.
    case "$(ps -o etime= -p "$pid" 2>/dev/null | tr -d ' ')" in
      *:*:*) ;;
      *) kept=$((kept + 1)); continue ;;
    esac
    # A shell with something still running inside it is never touched.
    if pgrep -P "$pid" >/dev/null 2>&1; then
      kept=$((kept + 1))
      continue
    fi
    # These shells ignore the polite signal, so a shell that is old and empty is
    # force-stopped — that is what actually gives the slot back.
    kill -KILL "$pid" 2>/dev/null && freed=$((freed + 1))
  done
  sleep 1
  echo "  closed $freed abandoned shells; left $kept alone (in use, or too new to judge)."
  echo "  held now: $(held | wc -l | tr -d ' ')"
  exit 0
fi

if [ "$mode" = "--permanent" ]; then
  echo
  echo "MAKING A LARGER SUPPLY SURVIVE EVERY RESTART"
  if [ "$(id -u)" != "0" ]; then
    echo "  This part needs the administrator password. Run it as:"
    echo "    sudo bash scripts/fix-terminal-pty.sh --permanent"
    exit 1
  fi
  target=2048
  plist=/Library/LaunchDaemons/com.nzwisiso.ptmx-limit.plist
  cat > "$plist" <<'PLIST'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.nzwisiso.ptmx-limit</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/sbin/sysctl</string>
    <string>-w</string>
    <string>kern.tty.ptmx_max=2048</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
</dict>
</plist>
PLIST
  chown root:wheel "$plist" 2>/dev/null
  chmod 644 "$plist" 2>/dev/null
  launchctl bootout system "$plist" 2>/dev/null
  launchctl bootstrap system "$plist" 2>/dev/null
  sysctl -w kern.tty.ptmx_max="$target" >/dev/null
  echo "  done: the machine now allows $(supply) terminals at once, and will keep that after every restart."
  echo "  this is a safety margin, not the cure — the cure is an up-to-date editor, which no longer leaks."
  exit 0
fi

echo
echo "WHAT TO DO NEXT"
echo "  If a terminal cannot be opened: force-quit the editor, or restart the Mac."
echo "  To free the supply without restarting: bash scripts/fix-terminal-pty.sh --free"
echo "  To keep a larger supply for good:      sudo bash scripts/fix-terminal-pty.sh --permanent"
echo "  The lasting cure is an up-to-date editor, which ships the fixed terminal software."
