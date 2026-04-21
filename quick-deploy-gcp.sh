#!/bin/bash
# Quick GCP Deployment - Run this on your LOCAL machine with gcloud CLI

# STEP 1: Set your project ID
read -p "Enter your GCP Project ID: " PROJECT_ID
gcloud config set project $PROJECT_ID

# STEP 2: Create VM
gcloud compute instances create ai-orchestration-vm \
  --zone=us-central1-a \
  --machine-type=e2-standard-4 \
  --boot-disk-size=50GB \
  --boot-disk-type=pd-ssd \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --tags=orchestration

# STEP 3: Firewall rules
gcloud compute firewall-rules create allow-orchestration \
  --allow tcp:80,tcp:443,tcp:3000,tcp:3001,tcp:9090,tcp:16686,tcp:5050 \
  --target-tags=orchestration \
  --source-ranges=0.0.0.0/0

# STEP 4: Get external IP
EXTERNAL_IP=$(gcloud compute instances describe ai-orchestration-vm \
  --zone=us-central1-a \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo ""
echo "VM Created! External IP: $EXTERNAL_IP"
echo ""
echo "Now SSH to your VM with:"
echo "gcloud compute ssh ai-orchestration-vm --zone=us-central1-a"
echo ""
echo "Then download and run the setup script:"
echo "curl -O https://raw.githubusercontent.com/muffy86/Autonomous-AI-orchestration-agent/cursor/full-orchestration-mcp-environment-e9c0/setup-on-vm.sh"
echo "chmod +x setup-on-vm.sh"
echo "./setup-on-vm.sh"
