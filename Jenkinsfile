pipeline {
    agent any

    environment {
        NODE_ENV = 'development'
        IMAGE_NAME = 'my-node-app'
        PATH = "/usr/local/bin:${env.PATH}"
        MINIKUBE_HOME = "${env.HOME}/.minikube"
    }

    stages {
        stage('Setup Minikube') {
            steps {
                script {
                    sh 'mkdir -p ${HOME}/.minikube'
                    sh 'minikube start --driver=docker --force'
                    sh 'eval $(minikube docker-env)'
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
                    
                    // Create complete deployment YAML file
                    sh """
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

                        # Apply the complete configuration
                        kubectl apply -f k8s-deployment.yaml
                        
                        # Get the service URL
                        sh 'minikube service merngraphql-service --url'
                    """
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning up...'
            sh 'minikube delete'
            sh 'eval $(minikube docker-env -u)'
        }
    }
}