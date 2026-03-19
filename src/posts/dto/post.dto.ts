export class CreatePostDto {
  title: string;
  content: string;
  image?: string;
}

export class UpdatePostDto {
  title?: string;
  content?: string;
  image?: string;
}

export class CommentDto {
  content: string;
}
