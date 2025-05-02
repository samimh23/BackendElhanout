import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import * as path from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const uploadPath = path.join(__dirname, '..', 'uploads');
  
  // Ensure the uploads folder exists
  if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
  }

  // Create a public directory for static files like payment success/cancel pages
  const publicPath = path.join(__dirname, '..', 'public');
  const paymentsPath = path.join(publicPath, 'payments');
  
  // Ensure the public and payments folders exist
  if (!fs.existsSync(publicPath)) {
      fs.mkdirSync(publicPath, { recursive: true });
  }
  if (!fs.existsSync(paymentsPath)) {
      fs.mkdirSync(paymentsPath, { recursive: true });
  }
  
  // Create success.html file if it doesn't exist
  const successHtmlPath = path.join(paymentsPath, 'success.html');
  if (!fs.existsSync(successHtmlPath)) {
    const successHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Payment Complete</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      padding: 40px;
      text-align: center;
      max-width: 90%;
      width: 500px;
    }
    h1 {
      color: #4CAF50;
      margin-top: 0;
    }
    .countdown {
      font-size: 18px;
      margin: 20px 0;
      color: #555;
    }
    .loader {
      border: 5px solid #f3f3f3;
      border-top: 5px solid #4CAF50;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 2s linear infinite;
      margin: 20px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Get the session_id from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session_id');
      
      // Set up countdown
      let secondsLeft = 5;
      const countdownElement = document.getElementById('countdown');
      
      function updateCountdown() {
        countdownElement.textContent = \`Redirecting back to app in \${secondsLeft} seconds...\`;
        if (secondsLeft <= 0) {
          // Redirect to your app with the session_id
          if (sessionId) {
            window.location.href = \`hanouty://payment-success?session_id=\${sessionId}\`;
          } else {
            document.getElementById('message').textContent = 'Error: Session ID not found.';
          }
        } else {
          secondsLeft--;
          setTimeout(updateCountdown, 1000);
        }
      }
      
      // Start countdown
      updateCountdown();
    });
  </script>
</head>
<body>
  <div class="container">
    <h1>Payment Successful!</h1>
    <p>Your subscription has been activated.</p>
    <div class="loader"></div>
    <div id="countdown" class="countdown">Redirecting back to app in 5 seconds...</div>
    <p id="message"></p>
  </div>
</body>
</html>`;
    fs.writeFileSync(successHtmlPath, successHtml);
  }
  
  // Create cancel.html file if it doesn't exist
  const cancelHtmlPath = path.join(paymentsPath, 'cancel.html');
  if (!fs.existsSync(cancelHtmlPath)) {
    const cancelHtml = `<!DOCTYPE html>
<html>
<head>
  <title>Payment Canceled</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      padding: 40px;
      text-align: center;
      max-width: 90%;
      width: 500px;
    }
    h1 {
      color: #F44336;
      margin-top: 0;
    }
    .countdown {
      font-size: 18px;
      margin: 20px 0;
      color: #555;
    }
  </style>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Set up countdown
      let secondsLeft = 5;
      const countdownElement = document.getElementById('countdown');
      
      function updateCountdown() {
        countdownElement.textContent = \`Redirecting back to app in \${secondsLeft} seconds...\`;
        if (secondsLeft <= 0) {
          // Redirect to your app with cancel status
          window.location.href = \`hanouty://payment-cancel\`;
        } else {
          secondsLeft--;
          setTimeout(updateCountdown, 1000);
        }
      }
      
      // Start countdown
      updateCountdown();
    });
  </script>
</head>
<body>
  <div class="container">
    <h1>Payment Canceled</h1>
    <p>Your payment was canceled. No charges were made.</p>
    <div id="countdown" class="countdown">Redirecting back to app in 5 seconds...</div>
  </div>
</body>
</html>`;
    fs.writeFileSync(cancelHtmlPath, cancelHtml);
  }

  // Serve uploaded files publicly
  app.use('/uploads', express.static(uploadPath));
  
  // Serve static files from public directory
  app.use('/public', express.static(publicPath));
  
  // For direct access to payment pages
  app.use('/payments', express.static(paymentsPath));
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(3000);
}
bootstrap();