param (
    [Parameter(Mandatory=$true, HelpMessage="Enter your EC2 Public IP address")]
    [string]$ServerIP
)

$PemFile = "vedaai.pem"
$Username = "ubuntu"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ">>> VedaAI Deployment Script" -ForegroundColor Cyan
Write-Host "Target: $Username@$ServerIP" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Package the application
Write-Host "`n>>> Packaging application files (this may take a moment)..." -ForegroundColor Yellow
if (Test-Path "vedaai-app.tar.gz") { Remove-Item "vedaai-app.tar.gz" }
tar.exe --exclude="backend/node_modules" --exclude="frontend/node_modules" --exclude="frontend/.next" --exclude="backend/uploads" -czf vedaai-app.tar.gz backend frontend nginx docker-compose.yml production.env

# 2. Transfer the package to EC2
Write-Host ">>> Transferring package to EC2..." -ForegroundColor Yellow
scp -i $PemFile -o StrictHostKeyChecking=no vedaai-app.tar.gz ${Username}@${ServerIP}:~/vedaai-app.tar.gz
if ($LASTEXITCODE -ne 0) {
    Write-Host "[X] Failed to transfer files." -ForegroundColor Red
    exit 1
}

# 3. Connect to EC2, extract, and deploy
Write-Host ">>> Connecting to EC2 to build and deploy..." -ForegroundColor Yellow
ssh -i $PemFile -o StrictHostKeyChecking=no ${Username}@${ServerIP} '
    echo ">> Preparing directory..."
    mkdir -p ~/vedaai
    tar -xzf ~/vedaai-app.tar.gz -C ~/vedaai
    cd ~/vedaai

    echo ">> Checking if Docker is installed..."
    if ! command -v docker > /dev/null 2>&1; then
        echo ">> Installing Docker and Docker Compose..."
        sudo apt-get update
        sudo apt-get install -y docker.io docker-compose
        sudo systemctl enable docker
        sudo systemctl start docker
        sudo usermod -aG docker ubuntu
    fi

    echo ">> Configuring environment variables..."
    cp production.env backend/.env
    
    echo ">> Building and starting containers..."
    sudo docker compose up -d --build

    echo ">> Cleaning up..."
    rm ~/vedaai-app.tar.gz
'

Write-Host "`n>>> Deployment process completed!" -ForegroundColor Green
Write-Host "It may take a few minutes for the backend/frontend images to finish building on the server." -ForegroundColor Green
Write-Host "After a few minutes, you can visit: http://$ServerIP" -ForegroundColor Green
