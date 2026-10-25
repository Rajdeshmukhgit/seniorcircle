#!/bin/bash
# Run in AWS CloudShell (region ap-south-1). Creates the security group,
# launches the Jenkins/Minikube server (2 vCPU / 8 GB) with ec2-bootstrap.sh
# as user-data, and gives it a fixed Elastic IP.
# Instance type: m7i-flex.large if the account's Free Tier covers it (accounts
# created on/after 15 Jul 2025), else c7i-flex.large, else t3.large (paid).
set -euo pipefail
export AWS_DEFAULT_REGION=ap-south-1
NAME=seniorcircle-jenkins

FREE=$(aws ec2 describe-instance-types --filters Name=free-tier-eligible,Values=true --query "InstanceTypes[*].InstanceType" --output text)
echo "Free-tier eligible types on this account: $FREE"
if   echo "$FREE" | grep -qw m7i-flex.large; then TYPE=m7i-flex.large
elif echo "$FREE" | grep -qw c7i-flex.large; then TYPE=c7i-flex.large
else
  TYPE=t3.large
  echo "WARNING: no free-tier 8 GB type on this account; using t3.large (about USD 0.09/hour)."
  read -r -p "Type yes to continue: " OK; [ "$OK" = "yes" ] || exit 1
fi
echo "Using instance type: $TYPE"

AMI=$(aws ssm get-parameter --name /aws/service/canonical/ubuntu/server/24.04/stable/current/amd64/hvm/ebs-gp3/ami-id --query Parameter.Value --output text)
VPC=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)

SG=$(aws ec2 describe-security-groups --filters Name=group-name,Values=${NAME}-sg Name=vpc-id,Values=$VPC --query 'SecurityGroups[0].GroupId' --output text)
if [ "$SG" = "None" ]; then
  SG=$(aws ec2 create-security-group --group-name ${NAME}-sg --description "Jenkins 8080, app 30080, SSH 22" --vpc-id $VPC --query GroupId --output text)
  for P in 22 8080 30080; do
    aws ec2 authorize-security-group-ingress --group-id $SG --protocol tcp --port $P --cidr 0.0.0.0/0 >/dev/null
  done
fi

ID=$(aws ec2 run-instances --image-id $AMI --instance-type $TYPE \
  --security-group-ids $SG \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":30,"VolumeType":"gp3"}}]' \
  --user-data file://ec2-bootstrap.sh \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$NAME}]" \
  --query 'Instances[0].InstanceId' --output text)
echo "Launched $ID, waiting for it to run..."
aws ec2 wait instance-running --instance-ids $ID

ALLOC=$(aws ec2 allocate-address --domain vpc --tag-specifications "ResourceType=elastic-ip,Tags=[{Key=Name,Value=$NAME}]" --query AllocationId --output text)
aws ec2 associate-address --instance-id $ID --allocation-id $ALLOC >/dev/null
IP=$(aws ec2 describe-addresses --allocation-ids $ALLOC --query 'Addresses[0].PublicIp' --output text)

echo "=============================================="
echo " Instance : $ID ($NAME, $TYPE, Ubuntu 24.04)"
echo " Security : $SG (22, 8080, 30080 open)"
echo " Public IP: $IP"
echo " Jenkins  : http://$IP:8080   (ready in ~10 min)"
echo " App      : http://$IP:30080  (after first pipeline run)"
echo "=============================================="
