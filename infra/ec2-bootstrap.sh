#!/bin/bash
# EC2 user-data script: turns a fresh Ubuntu 24.04 server (2 vCPU / 8 GB, e.g. m7i-flex.large) into the CI/CD server.
# Installs Docker, Jenkins (Java 21), Node.js 22, kubectl and Minikube, starts a
# Minikube cluster owned by the jenkins user, and forwards port 30080 on the
# EC2 host to the Minikube NodePort so the app is reachable from a browser.
# Progress is logged to /var/log/bootstrap.log; it finishes by writing
# /var/log/bootstrap.done.
set -euxo pipefail
exec > >(tee -a /var/log/bootstrap.log) 2>&1
export DEBIAN_FRONTEND=noninteractive

# --- 4 GB swap so `next build` and Minikube fit comfortably in 8 GB RAM ---
if [ ! -f /swapfile ]; then
  fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

apt-get update -y
apt-get install -y ca-certificates curl gnupg git fontconfig openjdk-21-jre socat conntrack unzip jq
install -m 0755 -d /etc/apt/keyrings

# --- Docker Engine ---
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  > /etc/apt/sources.list.d/docker.list

# --- Jenkins LTS (repository signing key rotated in 2026; fall back to keyserver) ---
if curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key -o /tmp/jenkins.key; then
  gpg --batch --yes --dearmor -o /usr/share/keyrings/jenkins-keyring.gpg /tmp/jenkins.key
else
  gpg --batch --keyserver hkps://keyserver.ubuntu.com --recv-keys 7198F4B714ABFC68
  gpg --batch --export 7198F4B714ABFC68 > /usr/share/keyrings/jenkins-keyring.gpg
fi
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.gpg] https://pkg.jenkins.io/debian-stable binary/" \
  > /etc/apt/sources.list.d/jenkins.list

# --- Node.js 22 (used by the Build & Test stages) ---
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -

apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin jenkins nodejs
systemctl enable --now docker

# Jenkins must be able to run docker and minikube
usermod -aG docker jenkins
usermod -aG docker ubuntu

# --- kubectl + Minikube ---
KVER=$(curl -fsSL https://dl.k8s.io/release/stable.txt)
curl -fsSLo /usr/local/bin/kubectl "https://dl.k8s.io/release/${KVER}/bin/linux/amd64/kubectl"
chmod +x /usr/local/bin/kubectl
curl -fsSLo /usr/local/bin/minikube https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
chmod +x /usr/local/bin/minikube

# --- Minikube cluster owned by the jenkins user, started on every boot ---
cat > /etc/systemd/system/minikube.service <<'UNIT'
[Unit]
Description=Minikube cluster for Jenkins
After=docker.service network-online.target
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
User=jenkins
Environment=HOME=/var/lib/jenkins
ExecStart=/usr/local/bin/minikube start --driver=docker --cpus=2 --memory=3072 --force-systemd=true
ExecStop=/usr/local/bin/minikube stop
TimeoutStartSec=900

[Install]
WantedBy=multi-user.target
UNIT

# --- Forward EC2:30080 -> Minikube NodePort 30080 (the Service in k8s/service.yaml) ---
cat > /usr/local/bin/minikube-forward.sh <<'FWD'
#!/bin/bash
IP=$(sudo -u jenkins HOME=/var/lib/jenkins /usr/local/bin/minikube ip)
exec /usr/bin/socat TCP-LISTEN:30080,fork,reuseaddr TCP:${IP}:30080
FWD
chmod +x /usr/local/bin/minikube-forward.sh
cat > /etc/systemd/system/minikube-forward.service <<'UNIT'
[Unit]
Description=Expose Minikube NodePort 30080 on the EC2 host
After=minikube.service
Requires=minikube.service

[Service]
ExecStart=/usr/local/bin/minikube-forward.sh
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT

systemctl daemon-reload
systemctl restart jenkins
systemctl enable --now minikube.service
systemctl enable --now minikube-forward.service

# kubectl for the ubuntu user too (handy over SSH): reuse jenkins' kubeconfig
mkdir -p /home/ubuntu/.kube
echo 'alias k="sudo -u jenkins kubectl"' >> /home/ubuntu/.bashrc

# --- Summary ---
{
  echo "java:     $(java -version 2>&1 | head -1)"
  echo "jenkins:  $(jenkins --version 2>/dev/null || dpkg -s jenkins | grep Version)"
  echo "docker:   $(docker --version)"
  echo "node:     $(node -v)"
  echo "kubectl:  $(kubectl version --client 2>/dev/null | head -1)"
  echo "minikube: $(minikube version --short)"
  echo "cluster:  $(sudo -u jenkins HOME=/var/lib/jenkins minikube status | tr '\n' ' ')"
  echo "jenkins initial admin password: $(cat /var/lib/jenkins/secrets/initialAdminPassword)"
} | tee /var/log/bootstrap.done
