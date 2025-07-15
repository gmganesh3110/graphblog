pipeline {
    agent any

    environment {
        NODE_ENV = 'development'
        IMAGE_NAME = 'my-node-app'
        PATH = "/usr/local/bin:${env.PATH}"  // ⬅️ This ensures Docker is found
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

        stage('Debug PATH') {
            steps {
                sh 'echo $PATH'
                sh 'which docker'
                sh 'docker --version'
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

        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                echo 'Deploying to production...'
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished.'
        }
        success {
            echo 'Build succeeded!'
        }
        failure {
            echo 'Build failed.'
        }
    }
}
