# AI draft (unaudited)

Run from this folder in PowerShell.

## Build and deploy
    minikube image build -t week09-api:v1 .
    kubectl apply -f k8s/
    kubectl get pods -w

## Open a tunnel (separate terminal, keep it open)
    minikube service api --url

## Cache check (use the URL printed above)
    curl.exe -i http://127.0.0.1:PORT/api/data/1
    curl.exe -i http://127.0.0.1:PORT/api/data/1
    kubectl exec deploy/redis -- redis-cli KEYS "*"
    kubectl exec deploy/redis -- redis-cli TTL data:1

## Load test
    npm ci
    $env:TARGET_URL = "http://127.0.0.1:PORT"
    npm run load

## Watch scaling (separate terminal)
    kubectl get hpa api -w
