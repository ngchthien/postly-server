import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto, CommentDto } from './dto/post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Request() req: any, @Body() createPostDto: CreatePostDto) {
    const userId = req.user.userId;
    return this.postsService.create(userId, createPostDto);
  }

  @Get()
  async findAll() {
    return this.postsService.findAll();
  }

  @Get('trending')
  async findTrending() {
    return this.postsService.findTrending();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.postsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
  ) {
    const post = await this.postsService.findOne(id);
    if (post.author['_id'].toString() !== req.user.userId) {
      throw new UnauthorizedException('You can only update your own posts');
    }
    return this.postsService.update(id, updatePostDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    const post = await this.postsService.findOne(id);
    if (post.author['_id'].toString() !== req.user.userId) {
      throw new UnauthorizedException('You can only delete your own posts');
    }
    return this.postsService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/like')
  async like(@Request() req: any, @Param('id') id: string) {
    return this.postsService.toggleLike(id, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/comment')
  async addComment(
    @Request() req: any,
    @Param('id') id: string,
    @Body() commentDto: CommentDto,
  ) {
    return this.postsService.addComment(
      id,
      req.user.userId,
      commentDto.content,
    );
  }
}
