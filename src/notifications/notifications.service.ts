import { Injectable, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';

@Injectable()
export class NotificationsService implements OnModuleInit {
  onModuleInit() {
    try {
      // Initialize Firebase Admin SDK
      const serviceAccountPath = path.join(
        process.cwd(),
        'postly-8c78a-firebase-adminsdk-fbsvc-cda1cc160e.json',
      );
      
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
        });
        console.log('Firebase Admin SDK initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing Firebase Admin SDK:', error.message);
      // We don't throw here to avoid crashing the whole app if firebase is not configured
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
