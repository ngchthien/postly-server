import { Injectable, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';

@Injectable()
export class NotificationsService implements OnModuleInit {
  onModuleInit() {
    try {
      if (admin.apps.length) return;

      const firebaseConfig = process.env.FIREBASE_CONFIG;

      if (firebaseConfig) {
        // Option 1: Load from Environment Variable (Best for Render/Heroku)
        const serviceAccount = JSON.parse(firebaseConfig);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase Admin SDK initialized from Environment Variable');
      } else {
        // Option 2: Fallback to local file (For Development)
        const serviceAccountPath = path.join(
          process.cwd(),
          'postly-8c78a-firebase-adminsdk-fbsvc-cda1cc160e.json',
        );

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
        });
        console.log('Firebase Admin SDK initialized from Local File');
      }
    } catch (error) {
      console.error('Error initializing Firebase Admin SDK:', error.message);
    }
  }

  async sendPushNotification(token: string, title: string, body: string, data?: any) {
    if (!token) return;

    const message: admin.messaging.Message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      token: token,
    };

    try {
      const response = await admin.messaging().send(message);
      return response;
    } catch (error) {
      console.error('Error sending push notification:', error);
      // Optional: Handle invalid tokens by removing them from the database
    }
  }
}
