import { Module, Global } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Global() // Make it global so other modules can use it easily
@Module({
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
