pipeline {
    agent any

    environment {
        NODE_ENV = 'development'
        IMAGE_NAME = 'my-node-app'
        PATH = "/usr/local/bin:${env.PATH}"
        MINIKUBE_HOME = "${env.HOME}/.minikube"  // Corrected Minikube home path
    }

    stages {
        stage('Setup Minikube') {
            steps {
                script {
                    // Create proper Minikube directory
                    sh 'mkdir -p ${HOME}/.minikube'
                    
                    // Start Minikube with proper driver (docker is usually best for CI)
                    sh 'minikube start --driver=docker --force'
                    
                    // Configure Docker to use Minikube's environment
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
                    
                    // Apply Kubernetes configuration
                    sh """
                        kubectl create configmap merngraphql-config \
                            --from-literal=PORT=4000 \
                            --from-literal=NODE_ENV=production \
                            --dry-run=client -o yaml > configmap.yaml
                        
                        kubectl create secret generic mongodb-secret \
                            --from-literal=MONGO_URI='mongodb+srv://Ganesh:root%40123@cluster0.pnuzrrg.mongodb.net/merngraphql?retryWrites=true&w=majority' \
                            --dry-run=client -o yaml > secret.yaml
                        
                        kubectl apply -f configmap.yaml
                        kubectl apply -f secret.yaml
                        
                        # Create deployment
                        kubectl create deployment merngraphql \
                            --image=${imageTag} \
                            --port=4000 \
                            --dry-run=client -o yaml > deployment.yaml
                        
                        # Add environment variables to deployment
                        sh '''sed -i '' -e '/containers:/a\\
                              envFrom:\\
                              - configMapRef:\\
                                  name: merngraphql-config\\
                              - secretRef:\\
                                  name: mongodb-secret' deployment.yaml'''
                        
                        kubectl apply -f deployment.yaml
                        
                        # Expose the service
                        kubectl expose deployment merngraphql \
                            --type=NodePort \
                            --port=80 \
                            --target-port=4000
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