import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UnauthorizedException,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewService } from './reviews.service';// Import the custom decorator
import { CurrentUser } from 'src/config/decorators/current-user.decorators';
import { AuthenticationGuard } from 'src/config/guards/authentication.guard';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post(':id')
  create(  @Body() createReviewDto: CreateReviewDto,@Param('id') id: string ) {
    return this.reviewService.create(createReviewDto, id);
  }

  @Get(':id')
  findAll(@Param('id') prodcut_id: string) {
    return this.reviewService.findAll(prodcut_id);
  }

  //  @docs   User logged Can Only update Their Review
  //  @Route  PATCH /api/v1/review
  //  @access Private [User]
  @Patch('update/:id')
  @UseGuards(AuthenticationGuard)
update(
  @Param('id') id: string,
  @Body() updateReviewDto: UpdateReviewDto,
  @CurrentUser() user, // Use the custom decorator to get the user
) {
  console.log('Request user object:', user); // Log the user object

  if (user.role.toLowerCase() === 'admin') {
    throw new UnauthorizedException();
  }

  const user_id = user.id; // Use 'id' instead of '_id'
  console.log('Extracted user ID:', user_id); // Log the extracted user ID

  // eslint-disable-next-line
  // @ts-ignore
  return this.reviewService.update(id, updateReviewDto, user_id);
}


  //  @docs   User logged Can Only delete Their Review
  //  @Route  DELETE /api/v1/review
  //  @access Private [User]
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    if (req.user.role.toLowerCase() === 'admin') {
      throw new UnauthorizedException();
    }
    const user_id = req.user._id;
    return this.reviewService.remove(id, user_id);
  }


  @Get('findReviewByUser/:userId')
  getReviewsByUserId(@Param('userId') userId: string) {
    return this.reviewService.getReviewsByUserId(userId);
  }

}