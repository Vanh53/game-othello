#!/bin/bash
# Script deploy toàn bộ hệ thống lên Kubernetes

set -e

echo "=== Build Docker images ==="
docker build -t identity-service:latest ./identity-service
docker build -t ai-model-service:latest ./ai-model-service
docker build -t pvp-service:latest ./pvp-service
docker build -t leaderboard-service:latest ./leaderboard-service
docker build -t api-gateway:latest ./api-gateway
docker build -t othello-frontend:latest ./frontend/othello-frontend

echo "=== Apply Kubernetes manifests ==="
kubectl apply -f k8s/namespace.yaml
kubectl create secret generic othello-secrets \
	--namespace othello \
	--from-env-file=.env \
	--dry-run=client -o yaml | kubectl apply -f -
kubectl apply -f k8s/configmap.yaml

# Infrastructure
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/kafka.yaml

echo "Waiting for infrastructure to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n othello --timeout=120s
kubectl wait --for=condition=ready pod -l app=redis -n othello --timeout=60s

# Services
kubectl apply -f k8s/identity-service.yaml
kubectl apply -f k8s/ai-model-service.yaml
kubectl apply -f k8s/pvp-service.yaml
kubectl apply -f k8s/leaderboard-service.yaml
kubectl apply -f k8s/api-gateway.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml

echo "=== Done! ==="
echo "Access: http://othello.local (add to /etc/hosts: 127.0.0.1 othello.local)"
kubectl get pods -n othello
