# eSewa Test API Helper Script (PowerShell)
# Usage: .\esewa-test-api.ps1 [command] [options]

param(
    [string]$Command = "help",
    [string]$Amount = "100",
    [string]$Tax = "0",
    [string]$Service = "0",
    [string]$Delivery = "0",
    [string]$UUID = ""
)

$BaseURL = "http://localhost:4000"

function Show-Header {
    Write-Host "=== eSewa Test API Helper ===" -ForegroundColor Cyan
    Write-Host ""
}

function Get-Credentials {
    Write-Host "Fetching eSewa test credentials..." -ForegroundColor Yellow
    $response = Invoke-WebRequest -Uri "$BaseURL/api/esewa-test/credentials" -Method GET
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host
}

function Generate-Payload {
    param(
        [string]$amount,
        [string]$tax = "0",
        [string]$service = "0",
        [string]$delivery = "0"
    )
    
    Write-Host "Generating test payment payload..." -ForegroundColor Yellow
    Write-Host "Amount: $amount, Tax: $tax, Service: $service, Delivery: $delivery" -ForegroundColor Gray
    
    $body = @{
        amount = $amount
        tax_amount = $tax
        service_charge = $service
        delivery_charge = $delivery
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "$BaseURL/api/esewa-test/generate-payload" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body
        $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
}

function Verify-Payment {
    param(
        [string]$uuid,
        [string]$amount = "100"
    )
    
    if ([string]::IsNullOrEmpty($uuid)) {
        Write-Host "ERROR: Transaction UUID required" -ForegroundColor Red
        Write-Host "Usage: .\esewa-test-api.ps1 verify -UUID <transaction_uuid> -Amount [amount]" -ForegroundColor Yellow
        return
    }
    
    Write-Host "Verifying test payment: $uuid" -ForegroundColor Yellow
    
    $body = @{
        transaction_uuid = $uuid
        total_amount = $amount
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "$BaseURL/api/esewa-test/verify" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body
        $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
    }
}

function Show-Help {
    Write-Host "Available commands:" -ForegroundColor Green
    Write-Host ""
    Write-Host "  credentials              Get eSewa test credentials and endpoints"
    Write-Host "  payload                  Generate test payment payload"
    Write-Host "  verify                   Verify a test payment"
    Write-Host "  help                     Show this help message"
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Green
    Write-Host "  -Amount      Payment amount (default: 100, min: 1)"
    Write-Host "  -Tax         Tax amount (default: 0)"
    Write-Host "  -Service     Service charge (default: 0)"
    Write-Host "  -Delivery    Delivery charge (default: 0)"
    Write-Host "  -UUID        Transaction UUID for verification"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\esewa-test-api.ps1 credentials"
    Write-Host "  .\esewa-test-api.ps1 payload -Amount 150"
    Write-Host "  .\esewa-test-api.ps1 payload -Amount 200 -Tax 10 -Service 5 -Delivery 50"
    Write-Host "  .\esewa-test-api.ps1 verify -UUID TEST-1234567890-ABC123"
    Write-Host ""
}

# Main command handler
Show-Header

switch ($Command.ToLower()) {
    "credentials" {
        Get-Credentials
    }
    "payload" {
        Generate-Payload -amount $Amount -tax $Tax -service $Service -delivery $Delivery
    }
    "verify" {
        Verify-Payment -uuid $UUID -amount $Amount
    }
    "help" {
        Show-Help
    }
    default {
        Write-Host "Unknown command: $Command" -ForegroundColor Red
        Write-Host ""
        Show-Help
    }
}
