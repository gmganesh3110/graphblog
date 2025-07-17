pipeline {
    agent any

    environment {
        NODE_ENV = 'development'
        IMAGE_NAME = 'my-node-app'
        PATH = "/usr/local/bin:${env.PATH}"
        MINIKUBE_HOME = "${env.HOME}/.minikube"
    }

    stages {
        stage('Setup Environment') {
            steps {
                script {
                    // Verify and install Minikube if needed (macOS version)
                    sh '''
                        #!/bin/bash -l
                        if ! command -v minikube &> /dev/null; then
                            echo "Installing Minikube..."
                            brew install minikube || {
                                curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-darwin-amd64
                                sudo install minikube-darwin-amd64 /usr/local/bin/minikube
                                rm minikube-darwin-amd64
                            }
                        fi
                        
                        if ! command -v kubectl &> /dev/null; then
                            echo "Installing kubectl..."
                            brew install kubectl || {
                                curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/darwin/amd64/kubectl"
                                chmod +x kubectl
                                sudo mv kubectl /usr/local/bin/
                            }
                        fi
                        
                        mkdir -p ${HOME}/.minikube
                        minikube version
                        kubectl version --client
                    '''
                }
            }
        }

        stage('Start Minikube') {
            steps {
                script {
                    sh '''
                        #!/bin/bash -l
                        minikube start --driver=docker --force
                        eval $(minikube docker-env)
                    '''
                }
            }
        }

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    def imageTag = "${IMAGE_NAME}:${env.BUILD_NUMBER}"
                    sh "docker build -t ${imageTag} ."
                    echo "Docker image ${imageTag} built successfully."
                }
            }
        }

        stage('Deploy to Minikube') {
            steps {
                script {
                    def imageTag = "${IMAGE_NAME}:${env.BUILD_NUMBER}"
                    
                    sh """
                        #!/bin/bash -l
                        cat <<EOF > k8s-deployment.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: merngraphql-config
data:
  PORT: "4000"
  NODE_ENV: "production"
---
apiVersion: v1
kind: Secret
metadata:
  name: mongodb-secret
type: Opaque
stringData:
  MONGO_URI: "mongodb+srv://Ganesh:root%40123@cluster0.pnuzrrg.mongodb.net/merngraphql?retryWrites=true&w=majority"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: merngraphql
spec:
  replicas: 2
  selector:
    matchLabels:
      app: merngraphql
  template:
    metadata:
      labels:
        app: merngraphql
    spec:
      containers:
      - name: merngraphql
        image: ${imageTag}
        ports:
        - containerPort: 4000
        envFrom:
        - configMapRef:
            name: merngraphql-config
        - secretRef:
            name: mongodb-secret
        readinessProbe:
          httpGet:
            path: /graphql
            port: 4000
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /graphql
            port: 4000
          initialDelaySeconds: 15
          periodSeconds: 20
---
apiVersion: v1
kind: Service
metadata:
  name: merngraphql-service
spec:
  selector:
    app: merngraphql
  ports:
  - protocol: TCP
    port: 80
    targetPort: 4000
  type: NodePort
EOF

                        kubectl apply -f k8s-deployment.yaml
                        
                        # Wait for service to be ready
                        sleep 10
                        
                        # Get minikube service URL (macOS specific)
                        minikube service merngraphql-service --url || true
                    """
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning up...'
            sh '''
                #!/bin/bash -l
                minikube delete || true
                eval $(minikube docker-env -u) || true
            '''
        }
    }
}