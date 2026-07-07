#!/usr/bin/env python3
from pathlib import Path

source = Path(__file__).resolve().parents[1] / "index.html"
lines = source.read_text(encoding="utf-8").splitlines()

ranges = [
    (6545, 6765),
    (3595, 3622),
]

out = []
for start, end in ranges:
    out.append(f"===== ORIGINAL LINES {start}-{end} =====\n")
    for n in range(start, min(end, len(lines)) + 1):
        out.append(f"{n}: {lines[n - 1]}\n")
    out.append("\n")

report = Path(__file__).with_name("export_flow_report.txt")
report.write_text("".join(out), encoding="utf-8")
print(report)
