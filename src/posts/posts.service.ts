import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto, UpdatePostDto } from './dto/post.dto';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    private usersService: UsersService,
    private notificationsService: NotificationsService,
  ) {}

  async create(
    userId: string,
    createPostDto: CreatePostDto,
  ): Promise<PostDocument> {
    const createdPost = new this.postModel({
      ...createPostDto,
      author: userId,
    });
    return createdPost.save();
  }

  async findAll(): Promise<PostDocument[]> {
    return this.postModel
      .find()
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findTrending(): Promise<PostDocument[]> {
    // Trending logic: sort by number of likes
    return this.postModel
      .find()
      .populate('author', 'name email')
      .sort({ likesCount: -1, createdAt: -1 })
      .limit(10)
      .exec();
  }

  async findOne(id: string): Promise<PostDocument> {
    const post = await this.postModel
      .findById(id)
      .populate('author', 'name email')
      .populate('comments.user', 'name')
      .exec();
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
  ): Promise<PostDocument> {
    const post = await this.postModel
      .findByIdAndUpdate(id, updatePostDto, { new: true })
      .exec();
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async remove(id: string): Promise<any> {
    const result = await this.postModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException('Post not found');
    return result;
  }

  async toggleLike(postId: string, userId: string): Promise<PostDocument> {
    const post = await this.postModel.findById(postId).exec();
    if (!post) throw new NotFoundException('Post not found');

    const index = post.likes.indexOf(userId as any);
    if (index === -1) {
      post.likes.push(userId as any);
    } else {
      post.likes.splice(index, 1);
    }

    // Update the likesCount field
    post.likesCount = post.likes.length;

    return post.save();
  }

  async addComment(
    postId: string,
    userId: string,
    content: string,
  ): Promise<PostDocument> {
    const post = await this.postModel.findById(postId).exec();
    if (!post) throw new NotFoundException('Post not found');

    post.comments.push({
      user: userId as any,
      content,
      createdAt: new Date(),
    });

    const updatedPost = await post.save();

    // Send push notification to post author
    try {
      const authorId = post.author.toString();
      // Don't send notification if you comment on your own post
      if (authorId !== userId) {
        const author = await this.usersService.findById(authorId);
        const commenter = await this.usersService.findById(userId);

        if (author?.fcmToken) {
          await this.notificationsService.sendPushNotification(
            author.fcmToken,
            'New Comment',
            `${commenter?.name || 'Someone'} commented on your post: "${content}"`,
            {
              postId,
              commenterId: userId,
            },
          );
        }
      }
    } catch (error) {
      console.error('Failed to send comment push notification:', error);
    }

    return updatedPost;
  }
}
