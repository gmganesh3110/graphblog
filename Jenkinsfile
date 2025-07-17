pipeline {
    agent any

    environment {
        NODE_ENV = 'development'
        IMAGE_NAME = 'my-node-app'
        PATH = "/usr/local/bin:${env.PATH}"
        MINIKUBE_HOME = '/usr/local/bin/minikube'  // Minikube path
    }

    tools {
        nodejs 'Nodejs'
    }

    stages {
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

        stage('Debug Environment') {
            steps {
                sh 'echo $PATH'
                sh 'which docker'
                sh 'docker --version'
                sh 'minikube version'
                sh 'kubectl version --client'
            }
        }

        stage('Start Minikube') {
            steps {
                script {
                    // Start Minikube if not running
                    sh 'minikube status || minikube start --driver=docker'
                    
                    // Point Docker to Minikube's Docker daemon
                    sh 'eval $(minikube docker-env)'
                    
                    // Verify we're using Minikube's Docker
                    sh 'docker info | grep "Name: minikube"'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    def imageTag = "${IMAGE_NAME}:${env.BUILD_NUMBER}"
                    sh "docker build -t ${imageTag} ."
                    echo "Docker image ${imageTag} built successfully in Minikube environment."
                }
            }
        }

        stage('Deploy to Minikube') {
            steps {
                script {
                    def imageTag = "${IMAGE_NAME}:${env.BUILD_NUMBER}"
                    def appName = "${IMAGE_NAME}-${env.BUILD_NUMBER}"
                    
                    // Apply Kubernetes deployment
                    sh """
                        kubectl create deployment ${appName} --image=${imageTag} --dry-run=client -o yaml > deployment.yaml
                        kubectl apply -f deployment.yaml
                    """
                    
                    // Expose the deployment as a service
                    sh "kubectl expose deployment ${appName} --type=NodePort --port=3000"
                    
                    // Get the service URL
                    sh "minikube service ${appName} --url"
                }
            }
        }

        stage('Verify Deployment') {
            steps {
                script {
                    // Wait for pods to be ready
                    sh 'kubectl wait --for=condition=ready pod -l app=${IMAGE_NAME}-${env.BUILD_NUMBER} --timeout=120s'
                    
                    // Get deployment status
                    sh 'kubectl get deployments'
                    sh 'kubectl get pods'
                    sh 'kubectl get services'
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished.'
            // Clean up Minikube Docker environment
            sh 'eval $(minikube docker-env -u)'
        }
        success {
            echo 'Build and deployment succeeded!'
        }
        failure {
            echo 'Build or deployment failed.'
        }
    }
}