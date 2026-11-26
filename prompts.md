# AI Prompt Log

**AI tool:** Claude

## Prompt 1: Initial draft (output saved in `ai-draft/`)

```text
Act as a senior cloud infrastructure and scalability architect. Build a high-performance, auto-scaling web application with an external distributed caching layer.

Requirements:
1. Web service in Node.js with TypeScript (Express): GET /api/data/:id simulates an expensive operation (500ms delay plus some CPU-bound work). Use the Cache-Aside pattern with an external Redis instance. On a hit, return immediately with header X-Cache: HIT. On a miss, run the slow operation, store the result in Redis with a 60-second TTL, and return X-Cache: MISS.
2. Redis deployed as its own service in Kubernetes.
3. Auto-scaling on Minikube: a Deployment with CPU/memory requests and limits, metrics-server, and a HorizontalPodAutoscaler targeting 50% CPU utilization (min 2, max 6 replicas).
4. A load testing script using Autocannon.

Provide the source code, Dockerfile, Kubernetes YAML manifests, load testing script, and step-by-step Windows PowerShell commands to run and test it.
```

## Other prompts
Add any later prompts that change code or configuration, word for word.