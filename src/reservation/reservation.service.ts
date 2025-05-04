import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Reservation } from './schema/reservation.schema';
import { Product } from 'src/product/entities/product.schema';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation.dto';

@Injectable()
export class ReservationService {
  constructor(
    @InjectModel(Reservation.name) private reservationModel: Model<Reservation>,
    @InjectModel(Product.name) private productModel: Model<Product>
  ) {}

  /**
   * Create a new reservation
   */
  async create(createReservationDto: CreateReservationDto, userId: string): Promise<Reservation> {
    // Check if product exists and has enough stock
    const product = await this.productModel.findById(createReservationDto.product);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if product is available in sufficient stock
    if (product.stock < createReservationDto.quantity) {
      throw new BadRequestException(`Only ${product.stock} items available for reservation`);
    }

    // Create new reservation
    const newReservation = new this.reservationModel({
      ...createReservationDto,
      user: userId,
      createdAt: new Date(),
      status: 'pending'
    });

    return newReservation.save();
  }

  /**
   * Get all reservations (for admin)
   */
  async findAll(status?: string): Promise<{ data: Reservation[] }> {
    const query: any = {};
    if (status) {
      query.status = status;
    }
    
    const data = await this.reservationModel.find(query)
      .populate('product', 'name price imageUrl')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .exec();

    return { data };
  }

  /**
   * Get reservations for a specific user
   */
  async findUserReservations(
    userId: string,
    status?: string
  ): Promise<{ data: Reservation[] }> {
    const query: any = { user: userId };
    if (status) {
      query.status = status;
    }
    
    const data = await this.reservationModel.find(query)
      .populate('product', 'name price imageUrl')
      .sort({ createdAt: -1 })
      .exec();

    return { data };
  }

  /**
   * Get a single reservation by ID
   */
  async findById(id: string): Promise<Reservation> {
    let reservation: Reservation;
    
    // Try finding by MongoDB ID first
    if (Types.ObjectId.isValid(id)) {
      reservation = await this.reservationModel.findById(id)
        .populate('product', 'name price imageUrl description')
        .populate('user', 'name email')
        .exec();
    }
    
    // If not found, try finding by idReservation
    if (!reservation) {
      reservation = await this.reservationModel.findOne({ idReservation: id })
        .populate('product', 'name price imageUrl description')
        .populate('user', 'name email')
        .exec();
    }
    
    if (!reservation) {
      throw new NotFoundException(`Reservation with id ${id} not found`);
    }
    
    return reservation;
  }

  /**
   * Update reservation status
   */
  async updateStatus(
    id: string, 
    updateStatusDto: UpdateReservationStatusDto,
    userId: string,
    isAdmin: boolean
  ): Promise<Reservation> {
    const reservation = await this.findById(id);
    
    // Check authorization - only owner or admin can update
    if (!isAdmin && reservation.user.toString() !== userId) {
      throw new BadRequestException('You are not authorized to update this reservation');
    }
    
    // Regular users can only cancel their reservations
    if (!isAdmin && updateStatusDto.status !== 'cancelled') {
      throw new BadRequestException('Users can only cancel reservations');
    }
    
    // Update status
    reservation.status = updateStatusDto.status;
    
    return reservation.save();
  }

  /**
   * Delete a reservation (admin only)
   */
  async remove(id: string): Promise<{ message: string }> {
    const result = await this.reservationModel.deleteOne({
      $or: [
        { _id: Types.ObjectId.isValid(id) ? id : null },
        { idReservation: id }
      ]
    }).exec();
    
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Reservation with id ${id} not found`);
    }
    
    return { message: 'Reservation deleted successfully' };
  }
  
  /**
   * Get reservations stats (admin only)
   */
  async getStats(): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Count reservations by status
    const statusCounts = await this.reservationModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Count today's reservations
    const todayReservations = await this.reservationModel.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    // Count today's pickups
    const todayPickups = await this.reservationModel.countDocuments({
      pickupDate: { $gte: today, $lt: tomorrow }
    });
    
    // Format status counts into object
    const statuses = {};
    statusCounts.forEach(status => {
      statuses[status._id] = status.count;
    });
    
    return {
      total: await this.reservationModel.countDocuments(),
      statuses,
      today: {
        newReservations: todayReservations,
        pickups: todayPickups
      }
    };
  }
}