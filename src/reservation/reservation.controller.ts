import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Delete,
  Patch,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation.dto';

@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post('add/:userId')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createReservationDto: CreateReservationDto,
    @Param('userId') userId: string
  ) {
    return this.reservationService.create(createReservationDto, userId);
  }

  @Get('user/:userId')
  async findUserReservations(
    @Param('userId') userId: string
  ) {
    return this.reservationService.findUserReservations(userId);
  }

  @Get('user/:userId/status/:status')
  async findUserReservationsByStatus(
    @Param('userId') userId: string,
    @Param('status') status: string
  ) {
    return this.reservationService.findUserReservations(userId, status);
  }

  @Get('all')
  async findAll() {
    return this.reservationService.findAll();
  }

  @Get('all/status/:status')
  async findAllByStatus(
    @Param('status') status: string
  ) {
    return this.reservationService.findAll(status);
  }

  @Get('stats')
  async getStats() {
    return this.reservationService.getStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.reservationService.findById(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string, 
    @Body() updateStatusDto: UpdateReservationStatusDto,
    @Body('userId') userId: string,
    @Param('isAdmin') isAdmin: string = 'false'
  ) {
    const isAdminBool = isAdmin === 'true';
    return this.reservationService.updateStatus(id, updateStatusDto, userId, isAdminBool);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    return this.reservationService.remove(id);
  }
}