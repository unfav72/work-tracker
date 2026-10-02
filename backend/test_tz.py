from datetime import datetime, timezone

# Let's say user inputs 18:10
dt_naive = datetime(2026, 10, 2, 18, 10)
# Make it aware using local timezone
dt_local = dt_naive.astimezone() 
# Convert to UTC
dt_utc = dt_local.astimezone(timezone.utc)
print(f"Naive: {dt_naive}")
print(f"Local: {dt_local}")
print(f"UTC: {dt_utc}")
