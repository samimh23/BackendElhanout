import { 
    Controller, 
    Post, 
    UseInterceptors, 
    UploadedFile,
    UseGuards,
    BadRequestException,
    Request
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { diskStorage } from 'multer';
  import { extname } from 'path';
  import { UsersService } from './users.service';
import { AuthenticationGuard } from 'src/config/guards/authentication.guard';
import { Multer } from 'multer';


  @Controller('users')
  export class UploadController {
    constructor(private readonly usersService: UsersService) {}
  
  
  }