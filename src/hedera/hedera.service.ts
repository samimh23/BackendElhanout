import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/Schemas/User.schema';
import axios from 'axios';

@Injectable()
export class HederaService {
  private readonly logger = new Logger(HederaService.name);
  private readonly baseUrl = 'https://hserv.onrender.com';

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  // Get user's Hedera credentials from database
  private async getUserCredentials(userId: string): Promise<{ accountId: string, privateKey: string }> {
    const user = await this.userModel.findById(userId);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    if (!user.headerAccountId || !user.privateKey) {
      throw new NotFoundException('User does not have Hedera credentials');
    }
    
    return {
      accountId: user.headerAccountId,
      privateKey: user.privateKey
    };
  }

  // Get user's balance
  async getBalance(userId: string) {
    try {
      const { accountId, privateKey } = await this.getUserCredentials(userId);
      
      this.logger.log(`Fetching balance for account: ${accountId}`);
      
      const response = await axios.post(
        `${this.baseUrl}/api/token/balance`,
        { accountId, privateKey },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      // Instead of returning the raw data, return a formatted response
      return { 
        balance: response.data,
        accountId: accountId,
        timestamp: new Date().toISOString() 
      };
    } catch (error) {
      // Error handling code...
    }
  }
  // Transfer tokens to another account
  async transferTokens(userId: string, receiverAccountId: string, amount: string) {
    try {
      const { accountId: senderAccountId, privateKey: senderPrivateKey } = 
        await this.getUserCredentials(userId);
      
      this.logger.log(`Transferring ${amount} tokens from ${senderAccountId} to ${receiverAccountId}`);
      
      const response = await axios.post(
        `${this.baseUrl}/api/token/transfer`,
        { 
          senderAccountId, 
          senderPrivateKey, 
          receiverAccountId, 
          amount 
        },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      return response.data;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Failed to transfer tokens: ${error.message}`);
      throw new InternalServerErrorException('Failed to transfer Hedera tokens');
    }
  }

  // Lock tokens
  async lockTokens(userId: string, amount: string) {
    try {
      const { accountId: senderAccountId, privateKey: senderPrivateKey } = 
        await this.getUserCredentials(userId);
      
      this.logger.log(`Locking ${amount} tokens from account ${senderAccountId}`);
      
      const response = await axios.post(
        `${this.baseUrl}/api/token/Lock`,
        { senderAccountId, senderPrivateKey, amount },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      return response.data;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Failed to lock tokens: ${error.message}`);
      throw new InternalServerErrorException('Failed to lock Hedera tokens');
    }
  }

  // Unlock tokens
  async unlockTokens(userId: string, amount: string) {
    try {
      const { accountId: receiverAccountId } = await this.getUserCredentials(userId);
      
      this.logger.log(`Unlocking ${amount} tokens to account ${receiverAccountId}`);
      
      const response = await axios.post(
        `${this.baseUrl}/api/token/Unlock`,
        { receiverAccountId, amount },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      return response.data;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Failed to unlock tokens: ${error.message}`);
      throw new InternalServerErrorException('Failed to unlock Hedera tokens');
    }
  }

  async traceTransactions(accountId: string) {
    try {
      this.logger.log(`Tracing transactions for account: ${accountId}`);
      
      const response = await axios.post(
        `${this.baseUrl}/api/token/trace`,
        { accountId },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to trace transactions: ${error.message}`);
      throw new InternalServerErrorException('Failed to trace Hedera transactions');
    }
  }

  /**
   * Trace transactions for the logged in user's account
   */
  async traceUserTransactions(userId: string) {
    try {
      const { accountId } = await this.getUserCredentials(userId);
      
      this.logger.log(`Tracing transactions for user ${userId} with account: ${accountId}`);
      
      return this.traceTransactions(accountId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error(`Failed to trace user transactions: ${error.message}`);
      throw new InternalServerErrorException('Failed to trace user transactions');
    }
  }

  // Create a new Hedera wallet
  async createWallet() {
    try {
      this.logger.log('Creating new Hedera wallet');
      
      const response = await axios.post(
        `${this.baseUrl}/api/wallet/create`,
        {},
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      if (response.status !== 201) {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
      
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to create wallet: ${error.message}`);
      throw new InternalServerErrorException('Failed to create Hedera wallet');
    }
  }
}