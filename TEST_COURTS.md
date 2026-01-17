# Court Management API - Test Commands

## Test with PowerShell

### 1. Get all courts (should be empty initially)
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/courts" -Method Get
```

### 2. Create Court 1
```powershell
$body = @{
    name = "Court 1 - Pro Lane"
    description = "Professional court with full-size pitch and premium facilities"
    features = @("LED Flood Lights", "Professional Nets", "Air Conditioned", "Video Recording")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/courts" -Method Post -Body $body -ContentType "application/json"
```

### 3. Create Court 2
```powershell
$body = @{
    name = "Court 2 - Practice Arena"
    description = "Perfect for practice sessions"
    features = @("LED Lights", "Bowling Machine", "Video Analysis")
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/courts" -Method Post -Body $body -ContentType "application/json"
```

### 4. Get all courts (should show created courts)
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/courts" -Method Get
```

### 5. Get specific court by ID (replace {id} with actual court ID)
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/courts/{id}" -Method Get
```

### 6. Update court status to maintenance
```powershell
$body = @{
    status = "maintenance"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/courts/{id}/status" -Method Patch -Body $body -ContentType "application/json"
```

### 7. Get only active courts
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/courts?status=active" -Method Get
```

## Quick Test - Create All 5 Courts
```powershell
# Court 1
Invoke-RestMethod -Uri "http://localhost:5000/api/courts" -Method Post -Body (@{name="Court 1 - Pro Lane";description="Professional court";features=@("LED Lights")} | ConvertTo-Json) -ContentType "application/json"

# Court 2
Invoke-RestMethod -Uri "http://localhost:5000/api/courts" -Method Post -Body (@{name="Court 2 - Practice Arena";description="Practice court";features=@("LED Lights","Bowling Machine")} | ConvertTo-Json) -ContentType "application/json"

# Court 3
Invoke-RestMethod -Uri "http://localhost:5000/api/courts" -Method Post -Body (@{name="Court 3 - Match Court";description="Match court";features=@("Full Size","LED Lights")} | ConvertTo-Json) -ContentType "application/json"

# Court 4
Invoke-RestMethod -Uri "http://localhost:5000/api/courts" -Method Post -Body (@{name="Court 4 - Training Zone";description="Training court";features=@("Multiple Wickets","LED Lights")} | ConvertTo-Json) -ContentType "application/json"

# Court 5
Invoke-RestMethod -Uri "http://localhost:5000/api/courts" -Method Post -Body (@{name="Court 5 - Elite Court";description="Elite court";features=@("Premium Turf","LED Lights","VIP Lounge")} | ConvertTo-Json) -ContentType "application/json"
```
