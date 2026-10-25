// CI/CD pipeline for SeniorCircle (Senior-Junior Connect).
// GitHub -> Jenkins (on AWS EC2) -> lint/typecheck/test/build -> Docker image
// -> Docker Hub -> Minikube (Kubernetes) -> verification.

pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
    timeout(time: 30, unit: 'MINUTES')
  }

  // Runs automatically on every push (GitHub webhook), with polling as a fallback.
  triggers {
    githubPush()
    pollSCM('H/5 * * * *')
  }

  environment {
    DOCKERHUB_USER = 'rajd27'
    IMAGE_NAME     = "${DOCKERHUB_USER}/seniorcircle"
    APP_SITE_URL   = 'https://seniorcircle.vercel.app'
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
        script {
          env.GIT_SHORT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
          // Meaningful, unique tag: Jenkins build number + git commit
          env.IMAGE_TAG = "${env.BUILD_NUMBER}-${env.GIT_SHORT}"
        }
        sh 'git log -1 --pretty="Commit %h by %an: %s"'
        echo "Image will be ${IMAGE_NAME}:${IMAGE_TAG}"
      }
    }

    stage('Install dependencies') {
      steps {
        sh 'node -v && npm -v'
        sh 'npm ci --no-audit --no-fund'
      }
    }

    stage('Lint & Test') {
      steps {
        sh 'npm run lint'        // ESLint, zero warnings allowed
        sh 'npm run typecheck'   // TypeScript compiler, no emit
        sh 'npm test'            // unit tests (node:test)
      }
    }

    stage('Build app') {
      steps {
        withCredentials([
          string(credentialsId: 'supabase-url',      variable: 'NEXT_PUBLIC_SUPABASE_URL'),
          string(credentialsId: 'supabase-anon-key', variable: 'NEXT_PUBLIC_SUPABASE_ANON_KEY')
        ]) {
          sh 'NEXT_PUBLIC_SITE_URL="$APP_SITE_URL" npm run build'
        }
      }
    }

    stage('Docker Build') {
      steps {
        withCredentials([
          string(credentialsId: 'supabase-url',      variable: 'SB_URL'),
          string(credentialsId: 'supabase-anon-key', variable: 'SB_KEY')
        ]) {
          sh '''
            docker build \
              --build-arg NEXT_PUBLIC_SUPABASE_URL="$SB_URL" \
              --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$SB_KEY" \
              --build-arg NEXT_PUBLIC_SITE_URL="$APP_SITE_URL" \
              -t "$IMAGE_NAME:$IMAGE_TAG" \
              -t "$IMAGE_NAME:latest" .
          '''
        }
        sh 'docker images "$IMAGE_NAME" --format "{{.Repository}}:{{.Tag}}  {{.Size}}" | head -3'
      }
    }

    stage('Push Image') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds',
                                          usernameVariable: 'DH_USER',
                                          passwordVariable: 'DH_TOKEN')]) {
          sh 'echo "$DH_TOKEN" | docker login -u "$DH_USER" --password-stdin'
          sh 'docker push "$IMAGE_NAME:$IMAGE_TAG"'
          sh 'docker push "$IMAGE_NAME:latest"'
        }
      }
    }

    stage('Deploy to Minikube') {
      steps {
        sh 'minikube status'
        // Point the Deployment at this build's exact tag, then apply both manifests.
        sh 'sed "s#rajd27/seniorcircle:latest#$IMAGE_NAME:$IMAGE_TAG#" k8s/deployment.yaml > deployment.rendered.yaml'
        sh 'kubectl apply -f k8s/service.yaml'
        sh 'kubectl apply -f deployment.rendered.yaml'
        sh 'kubectl annotate deployment/seniorcircle kubernetes.io/change-cause="Jenkins build $BUILD_NUMBER, commit $GIT_SHORT" --overwrite'
        sh 'kubectl rollout status deployment/seniorcircle --timeout=300s'
      }
    }

    stage('Verify') {
      steps {
        sh 'kubectl get deployment seniorcircle -o wide'
        sh 'kubectl get pods -l app=seniorcircle -o wide'
        sh 'kubectl get service seniorcircle-service'
        sh 'kubectl get pods -l app=seniorcircle -o jsonpath="{range .items[*]}{.metadata.name}{\\"  \\"}{.spec.containers[0].image}{\\"\\n\\"}{end}"'
        sh 'kubectl rollout history deployment/seniorcircle | tail -5'
        sh 'curl -fsS --retry 5 --retry-delay 3 "http://$(minikube ip):30080/api/health"'
        script {
          def publicIp = sh(script: 'curl -fsS -m 3 http://checkip.amazonaws.com || echo "<EC2-public-IP>"', returnStdout: true).trim()
          echo "Application is live at http://${publicIp}:30080"
        }
      }
    }
  }

  post {
    always {
      sh 'docker logout || true'
      sh 'rm -f deployment.rendered.yaml'
      sh 'docker image prune -f || true'
    }
    success {
      echo "SUCCESS: ${IMAGE_NAME}:${IMAGE_TAG} is running on Minikube."
    }
    failure {
      echo 'FAILED: check the stage marked red above.'
    }
  }
}
