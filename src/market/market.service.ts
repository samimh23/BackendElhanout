import { Injectable, NotFoundException, BadRequestException, Logger, ForbiddenException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { NormalMarket } from "./schema/normal-market.schema";
import { CreateMarketDto } from "./dto/create-market.dto";
import { UpdateMarketDto } from "./dto/update-market.dto";
import { ShareFractionDto } from "./dto/ShareFraction.dto";
import { User } from "src/users/Schemas/User.schema";
import { firstValueFrom } from 'rxjs';
import axios, { AxiosResponse } from 'axios';
import * as dotenv from 'dotenv';

import {
  Client,
  PrivateKey,
  AccountBalanceQuery,
  AccountCreateTransaction,
  Hbar,
  TransferTransaction
} from "@hashgraph/sdk";
import { ShareSaleListing } from "./Schema/ShareSaleListing.schema";
import { Market } from "./entities/market.entity";

dotenv.config();

interface NFTResponse {
  success: boolean;
  message: string;
  data: {
    tokenId: string;
    tokenName: string;
    symbol: string;
    totalShares: number;
    marketAccount: string;
    marketShares: number;
  };
}

interface ShareResponse {
  success: boolean;
  message: string;
  data: {
    sender: {
      accountId: string;
      shares: number;
      percentage: number;
    };
    recipient: {
      accountId: string;
      shares: number;
      percentage: number;
    };
    transactionId?: string;
  };
}

interface OwnershipResponse {
  success: boolean;
  message: string;
  data: {
    fractionalTokenId: string;
    totalShares: number;
    ownershipDistribution: Array<{
      accountId: string;
      shares: number;
      percentage: number;
    }>;
  };
}

@Injectable()
export class MarketService {
  private readonly logger = new Logger(MarketService.name);
  private readonly client: Client;
  private readonly operatorId: string;
  private readonly operatorKey: PrivateKey;
  private readonly nftApiUrl: string;
  
  constructor(
    @InjectModel(NormalMarket.name) private normalMarketModel: Model<NormalMarket>,
    @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(ShareSaleListing.name) private saleListingModel: Model<ShareSaleListing>,

    private readonly httpService: HttpService
  ) {
    this.operatorId = process.env.HEDERA_ACCOUNT_ID;
    if (!this.operatorId) {
      this.logger.error("⚠️ No Hedera account ID found in environment variables!");
      throw new Error("HEDERA_ACCOUNT_ID environment variable must be set");
    }
    
    const operatorPrivateKey = process.env.HEDERA_PRIVATE_KEY;
    if (!operatorPrivateKey) {
      this.logger.error("⚠️ No Hedera private key found in environment variables!");
      throw new Error("HEDERA_PRIVATE_KEY environment variable must be set");
    }
    
    try {
      this.operatorKey = PrivateKey.fromStringECDSA(operatorPrivateKey);
      this.client = Client.forTestnet();
      this.client.setOperator(this.operatorId, this.operatorKey);
      this.logger.log("✅ Successfully connected to Hedera network");
    } catch (error) {
      this.logger.error("Failed to initialize Hedera connection:", error);
      throw new Error(`Failed to initialize Hedera connection: ${error.message}`);
    }

    this.nftApiUrl = process.env.NFT_API_URL || 'http://localhost:3001/api';
    this.logger.log(`✅ Using NFT API at: ${this.nftApiUrl}`);
    
    this.checkOperatorBalance();
  }

  private async checkOperatorBalance() {
    try {
      const accountBalance = await new AccountBalanceQuery()
        .setAccountId(this.operatorId)
        .execute(this.client);
      
      const hbarBalance = accountBalance.hbars.toString();
      this.logger.log(`💰 Operator account balance: ${hbarBalance}`);
      
      if (accountBalance.hbars.toTinybars().lessThan(100_000_000)) {
        this.logger.warn(`⚠️ WARNING: Operator account has low balance. Please fund this address: ${this.operatorId}`);
      }
    } catch (error) {
      this.logger.error("Failed to check operator account balance:", error);
    }
  }

  private async createMarketAccount(marketName: string): Promise<{ accountId: string, privateKey: string }> {
    try {
      this.logger.log(`Creating new Hedera account for market: ${marketName}`);
      
      const marketPrivateKey = PrivateKey.generateED25519();
      const marketPublicKey = marketPrivateKey.publicKey;
      
      
      const initialBalance = 5;
      
      const transaction = new AccountCreateTransaction()
        .setKey(marketPublicKey)
        .setInitialBalance(new Hbar(initialBalance))
        .freezeWith(this.client);
      
      const signedTx = await transaction.sign(this.operatorKey);
      const txResponse = await signedTx.execute(this.client);
      
      const receipt = await txResponse.getReceipt(this.client);
      const newAccountId = receipt.accountId.toString();
      
      this.logger.log(`✅ Created Hedera account for market: ${newAccountId}`);
      this.logger.log(`💰 Funded with initial balance: ${initialBalance} HBAR`);
      
      return {
        accountId: newAccountId,
        privateKey: marketPrivateKey.toString()
      };
    } catch (error) {
      this.logger.error(`Failed to create Hedera account: ${error.message}`);
      throw new Error(`Could not create Hedera account: ${error.message}`);
    }
  }

  async create(createNormalMarketDto: CreateMarketDto, userId: string): Promise<NormalMarket> {
    this.logger.log(`🎯 Creating Market: ${createNormalMarketDto.marketName} for user ${userId}`);
  
    try {
      const marketAccount = await this.createMarketAccount(createNormalMarketDto.marketName);
      
      this.logger.log(`✅ Generated Hedera account for market: ${marketAccount.accountId}`);
      
      let fractionalNFTAddress = "PENDING_CREATION";
      let fractions = 10000; 
      
      const newMarket = new this.normalMarketModel({
        ...createNormalMarketDto,
        marketWalletPublicKey: marketAccount.accountId, 
        marketWalletSecretKey: marketAccount.privateKey, 
        fractionalNFTAddress: fractionalNFTAddress,
        fractions: fractions,
        owner: new Types.ObjectId(userId),
        marketType: 'normal'
      });
  
      const savedMarket = await newMarket.save();
      this.logger.log(`✅ Market saved to database with ID: ${savedMarket._id}`);
      
      try {
        const requestData = {
          name: `Market: ${savedMarket.marketName}`,
          symbol: `MKT-${savedMarket._id.toString().substring(0, 5)}`,
          marketAccountId: marketAccount.accountId,
          marketPrivateKey: marketAccount.privateKey
        };
        
        this.logger.log(`🔍 Making request to: ${this.nftApiUrl}/create`);
        
        const response: AxiosResponse<NFTResponse> = await firstValueFrom(
          this.httpService.post<NFTResponse>(`${this.nftApiUrl}/create`, requestData)
        );
        
        if (!response.data.success) {
          throw new Error(response.data.message || 'NFT creation failed');
        }
        
        savedMarket.fractionalNFTAddress = response.data.data.tokenId;
        await savedMarket.save();
        
        this.logger.log(`✅ Created fractional token (${response.data.data.tokenId}) for market via API`);
      } catch (error) {
        this.logger.warn(`⚠️ Could not create token automatically: ${error.message}. Market created without token.`);
      }
      
      try {
        const marketId = savedMarket._id;
        const user = await this.userModel.findById(userId);
        
        if (!user) {
          throw new Error(`User with ID ${userId} not found`);
        }
        
        if (!user.markets) {
          user.markets = [];
        }
        
        user.markets.push(marketId);
        await user.save();
        
        this.logger.log(`✅ Added market ${marketId} to user ${userId}'s markets array`);
      } catch (updateError) {
        this.logger.error(`⚠️ Failed to update user's markets array: ${updateError.message}`, updateError.stack);
      }
      return savedMarket;
    } catch (error) {
      this.logger.error('Failed to create market:', error);
      throw new BadRequestException(`Failed to create market: ${error.message}`);
    }
  }

  async createTokenForExistingMarket(marketId: string, userId: string): Promise<NormalMarket> {
    const market = await this.normalMarketModel.findById(marketId);
    if (!market) {
      throw new NotFoundException("Market not found");
    }
    
    if (market.owner && market.owner.toString() !== userId) {
      throw new BadRequestException("You don't have permission to create token for this market");
    }
    
    if (market.fractionalNFTAddress && market.fractionalNFTAddress !== "PENDING_CREATION") {
      return market;
    }
    
    try {
      const requestData = {
        name: `Market: ${market.marketName}`,
        symbol: `MKT-${market._id.toString().substring(0, 5)}`,
        marketAccountId: market.marketWalletPublicKey,
        marketPrivateKey: market.marketWalletSecretKey
      };
      
      this.logger.log(`Making request to: ${this.nftApiUrl}/create`);
      
      const response: AxiosResponse<NFTResponse> = await firstValueFrom(
        this.httpService.post<NFTResponse>(`${this.nftApiUrl}/create`, requestData)
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Token creation failed');
      }
      
      market.fractionalNFTAddress = response.data.data.tokenId;
      await market.save();
      
      this.logger.log(`✅ Created fractional token (${response.data.data.tokenId}) for existing market via API`);
      
      return market;
    } catch (error) {
      this.logger.error("Failed to create fractional token for existing market:", error);
      throw new BadRequestException(`Failed to create fractional token: ${error.message}`);
    }
  }

  async shareFractionalNFT(
    marketId: string,
    shareData: ShareFractionDto,
    userId: string
  ): Promise<{ success: boolean; transactionId: string; recipientHederaId?: string }> {
    if (shareData.percentage <= 0 || shareData.percentage > 100) {
      throw new BadRequestException('Percentage must be between 0 and 100');
    }
  
    this.logger.log(`Starting share of ${shareData.percentage}% tokens to ${shareData.recipientAddress}`);
  
    const market = await this.normalMarketModel.findById(marketId);
    if (!market) {
      throw new NotFoundException("Market not found");
    }
  
    if (market.owner && market.owner.toString() !== userId) {
      throw new BadRequestException("You don't have permission to share token for this market");
    }
  
    if (!market.fractionalNFTAddress || market.fractionalNFTAddress === "PENDING_CREATION") {
      throw new BadRequestException("This market doesn't have a valid fractional token yet");
    }
  
    try {
      let recipientHederaId: string = shareData.recipientAddress;
      let recipientPrivateKey: string | undefined;
      let recipientResolvedType: string = 'unknown';
  
      // === RESOLVE RECIPIENT ===
      const isDirectHederaAccount = /^0\.0\.\d+$/.test(shareData.recipientAddress);
  
      if (isDirectHederaAccount) {
        // Try user first
        const userWithAccount = await this.userModel.findOne({ headerAccountId: recipientHederaId });
        if (userWithAccount?.privateKey) {
          recipientPrivateKey = userWithAccount.privateKey;
          recipientResolvedType = "user";
          this.logger.log(`Resolved recipient as USER with accountId=${recipientHederaId}`);
        } else {
          // Try market
          const marketWithAccount = await this.normalMarketModel.findOne({ marketWalletPublicKey: recipientHederaId });
          if (marketWithAccount?.marketWalletSecretKey) {
            recipientPrivateKey = marketWithAccount.marketWalletSecretKey;
            recipientResolvedType = "market";
            this.logger.log(`Resolved recipient as MARKET with accountId=${recipientHederaId}`);
          } else {
            this.logger.warn(`No local private key found for accountId=${recipientHederaId}`);
          }
        }
      } else if (Types.ObjectId.isValid(shareData.recipientAddress)) {
        let recipientType = shareData.recipientType || null;
        if (recipientType === 'user') {
          const user = await this.userModel.findById(shareData.recipientAddress);
          this.logger.log('USER LOOKUP:', JSON.stringify(user));
          if (user?.headerAccountId && user?.privateKey) {
            recipientHederaId = user.headerAccountId;
            recipientPrivateKey = user.privateKey;
            recipientResolvedType = "user";
            this.logger.log(`Resolved recipient as USER by ObjectId: ${recipientHederaId}`);
          } else {
            throw new BadRequestException(`User ${shareData.recipientAddress} doesn't have a Hedera account configured`);
          }
        } else if (recipientType === 'market') {
          const recipientMarket = await this.normalMarketModel.findById(shareData.recipientAddress);
          this.logger.log('MARKET LOOKUP:', JSON.stringify(recipientMarket));
          if (recipientMarket?.marketWalletPublicKey && recipientMarket?.marketWalletSecretKey) {
            recipientHederaId = recipientMarket.marketWalletPublicKey;
            recipientPrivateKey = recipientMarket.marketWalletSecretKey;
            recipientResolvedType = "market";
            this.logger.log(`Resolved recipient as MARKET by ObjectId: ${recipientHederaId}`);
          } else {
            throw new BadRequestException(`Market ${shareData.recipientAddress} doesn't have a valid Hedera account`);
          }
        } else {
          // Try user first, then market
          const user = await this.userModel.findById(shareData.recipientAddress);
          this.logger.log('USER FALLBACK LOOKUP:', JSON.stringify(user));
          if (user?.headerAccountId && user?.privateKey) {
            recipientHederaId = user.headerAccountId;
            recipientPrivateKey = user.privateKey;
            recipientResolvedType = "user";
            this.logger.log(`Resolved recipient as USER by fallback: ${recipientHederaId}`);
          } else {
            const recipientMarket = await this.normalMarketModel.findById(shareData.recipientAddress);
            this.logger.log('MARKET FALLBACK LOOKUP:', JSON.stringify(recipientMarket));
            if (recipientMarket?.marketWalletPublicKey && recipientMarket?.marketWalletSecretKey) {
              recipientHederaId = recipientMarket.marketWalletPublicKey;
              recipientPrivateKey = recipientMarket.marketWalletSecretKey;
              recipientResolvedType = "market";
              this.logger.log(`Resolved recipient as MARKET by fallback: ${recipientHederaId}`);
            } else {
              throw new BadRequestException(`Recipient ${shareData.recipientAddress} not found or doesn't have a valid Hedera account`);
            }
          }
        }
      } else {
        throw new BadRequestException(`Invalid recipient address format. Must be a valid ObjectId or Hedera account ID (0.0.XXXX).`);
      }
  
      this.logger.log(`[DEBUG] recipientId=${recipientHederaId}, recipientType=${recipientResolvedType}, privateKey=${recipientPrivateKey ? '[REDACTED]' : 'MISSING'}`);
  
      // === SHARE LOGIC ===
      const performShare = async (): Promise<AxiosResponse<ShareResponse>> => {
        const requestData: any = {
          tokenId: market.fractionalNFTAddress,
          recipientId: recipientHederaId,
          percentageToShare: shareData.percentage,
          marketAccountId: market.marketWalletPublicKey,
          marketPrivateKey: market.marketWalletSecretKey,
        };
        if (recipientPrivateKey) {
          requestData['recipientPrivateKey'] = recipientPrivateKey;
        }
        this.logger.log(`[SHARE] Calling NFT API at ${this.nftApiUrl}/share with recipient: ${recipientHederaId}`);
        this.logger.log(`[SHARE] Request data: ${JSON.stringify({
          ...requestData,
          marketPrivateKey: '[REDACTED]',
          recipientPrivateKey: recipientPrivateKey ? '[REDACTED]' : undefined
        })}`);
        return await firstValueFrom(
          this.httpService.post<ShareResponse>(`${this.nftApiUrl}/share`, requestData)
        );
      };
  
      let response: AxiosResponse<ShareResponse>;
      let attemptedAssociation = false;
  
      try {
        response = await performShare();
      } catch (error) {
        const apiError = error?.response?.data;
        this.logger.error(`[ERROR] Initial share failed: ${JSON.stringify(apiError)}`);
        // Even if we send recipientPrivateKey, some APIs require explicit association first
        if (
          apiError?.error === 'TOKEN_NOT_ASSOCIATED_TO_ACCOUNT' &&
          recipientPrivateKey &&
          !attemptedAssociation
        ) {
          this.logger.warn(
            `[ASSOCIATE] Recipient's account not associated, will call /associate with accountId=${recipientHederaId}, type=${recipientResolvedType}`
          );
          // Explicitly associate
          const associateData = {
            tokenId: market.fractionalNFTAddress,
            accountId: recipientHederaId,
            privateKey: recipientPrivateKey
          };
          this.logger.log(`[ASSOCIATE] Request: ${JSON.stringify({
            ...associateData,
            privateKey: '[REDACTED]'
          })}`);
          const associateResponse = await firstValueFrom(
            this.httpService.post(`${this.nftApiUrl}/associate`, associateData)
          );
          this.logger.log(`[ASSOCIATE] Response: ${JSON.stringify(associateResponse.data)}`);
          if (associateResponse.data.success) {
            attemptedAssociation = true;
            this.logger.log('[ASSOCIATE] Association succeeded or already present, retrying share...');
            response = await performShare();
          } else {
            throw new BadRequestException(
              `Could not associate token: ${associateResponse.data.message}`
            );
          }
        } else {
          this.logger.error('[ERROR] Share failed and association not attempted or failed:', error);
          throw error;
        }
      }
  
      if (!response.data.success) {
        throw new Error(response.data.message || 'Share operation failed');
      }
  
      const result = response.data.data;
      const remainingShares = result.sender.shares;
  
      await this.normalMarketModel.findByIdAndUpdate(marketId, {
        fractions: remainingShares
      });
  
      this.logger.log(`✅ Successfully shared ${shareData.percentage}% ownership with ${recipientHederaId}`);
      this.logger.log(`Recipient now has ${result.recipient.shares} shares (${result.recipient.percentage.toFixed(2)}%)`);
  
      return {
        success: true,
        transactionId: result.transactionId || 'API_TRANSACTION',
        recipientHederaId: recipientHederaId
      };
    } catch (error) {
      this.logger.error('[ERROR] Failed to share fractional token:', error);
  
      if (error.response?.data) {
        this.logger.error(`[ERROR] API error details: ${JSON.stringify(error.response.data)}`);
        if (error.response.data.message?.includes('TOKEN_NOT_ASSOCIATED_TO_ACCOUNT')) {
          throw new BadRequestException(
            `Token association required: The recipient account ${error.response.data.message.match(/account\s+([0-9.]+)/)?.[1] || shareData.recipientAddress
            } must be associated with the token ${market.fractionalNFTAddress} first. Please associate the token before transferring or provide an account with pre-associated token.`
          );
        }
      }
  
      if (error instanceof BadRequestException) {
        throw error;
      }
  
      throw new BadRequestException(`Failed to share fractional token: ${error.message}`);
    }
  }
  
  async checkTokenOwnership(marketId: string): Promise<any[]> {
    try {
      const market = await this.normalMarketModel.findById(marketId);
      if (!market || !market.fractionalNFTAddress) {
        throw new NotFoundException("Market or fractional token not found");
      }
      
      const response: AxiosResponse<OwnershipResponse> = await firstValueFrom(
        this.httpService.get<OwnershipResponse>(
          `${this.nftApiUrl}/check?tokenId=${market.fractionalNFTAddress}&marketAccountId=${market.marketWalletPublicKey}`
        )
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Check ownership operation failed');
      }
      
      const ownershipDistribution = response.data.data.ownershipDistribution;
      
      const marketOwnership = ownershipDistribution.find(o => o.accountId === market.marketWalletPublicKey);
      if (marketOwnership) {
        await this.normalMarketModel.findByIdAndUpdate(marketId, {
          fractions: marketOwnership.shares
        });
      }
      
      return ownershipDistribution;
    } catch (error) {
      this.logger.error(`Error checking token ownership: ${error.message}`);
      throw new BadRequestException(`Failed to check token ownership: ${error.message}`);
    }
  }

  async fundMarketAccount(marketId: string, userId: string, amountInHbar: number): Promise<any> {
    const market = await this.normalMarketModel.findById(marketId);
    if (!market) {
      throw new NotFoundException("Market not found");
    }
    
    if (market.owner && market.owner.toString() !== userId) {
      throw new BadRequestException("You don't have permission to fund this market");
    }
    
    try {
      const transferTx = await new TransferTransaction()
        .addHbarTransfer(this.operatorId, new Hbar(-amountInHbar))
        .addHbarTransfer(market.marketWalletPublicKey, new Hbar(amountInHbar))
        .freezeWith(this.client);
      
      const signedTx = await transferTx.sign(this.operatorKey);
      const txResponse = await signedTx.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      
      this.logger.log(`✅ Successfully funded market account ${market.marketWalletPublicKey} with ${amountInHbar} HBAR`);
      
      const accountBalance = await new AccountBalanceQuery()
        .setAccountId(market.marketWalletPublicKey)
        .execute(this.client);
      
      const hbarBalance = accountBalance.hbars.toString();
      
      return {
        success: true,
        status: receipt.status.toString(),
        marketId: marketId,
        marketName: market.marketName,
        accountId: market.marketWalletPublicKey,
        amountTransferred: amountInHbar,
        newBalance: hbarBalance
      };
    } catch (error) {
      this.logger.error(`Failed to fund market account: ${error.message}`);
      throw new BadRequestException(`Failed to fund market account: ${error.message}`);
    }
  }

  async findAll(): Promise<NormalMarket[]> {
    return this.normalMarketModel.find().exec();
  }

  async findOne(id: string): Promise<NormalMarket> {
    return this.normalMarketModel.findById(id).exec();
  }

  async update(id: string, updateNormalMarketDto: UpdateMarketDto, userId: string): Promise<NormalMarket> {
    const market = await this.normalMarketModel.findById(id);
    if (!market) {
      throw new NotFoundException("Market not found");
    }
    
    if (market.owner && market.owner.toString() !== userId) {
      throw new BadRequestException("You don't have permission to update this market");
    }
    
    return this.normalMarketModel.findByIdAndUpdate(id, updateNormalMarketDto, { new: true }).exec();
  }

  async remove(id: string, userId: string): Promise<NormalMarket> {
    const existingMarket = await this.normalMarketModel.findById(id);
    if (!existingMarket) {
      throw new NotFoundException("Market not found");
    }
    
    if (existingMarket.owner && existingMarket.owner.toString() !== userId) {
      throw new BadRequestException("You don't have permission to delete this market");
    }
    
    return this.normalMarketModel.findByIdAndDelete(id).exec();
  }

  async getMarketsByOwner(ownerId: string): Promise<NormalMarket[]> {
    this.logger.log(`Fetching markets for owner with ID: ${ownerId}`);
    
    if (!Types.ObjectId.isValid(ownerId)) {
      throw new BadRequestException('Invalid owner ID format');
    }
    
    const ownerObjectId = new Types.ObjectId(ownerId);
    const markets = await this.normalMarketModel.find({ 
      owner: ownerObjectId 
    }).exec();
    
    this.logger.log(`Found ${markets.length} markets for owner ${ownerId}`);
    return markets;
  }

  
  
  async transferTokensToOwner(marketId: string, amount: number, requestUserId: string): Promise<any> {
    try {
      if (!Types.ObjectId.isValid(marketId)) {
        throw new NotFoundException(`Invalid market ID format: ${marketId}`);
      }
      
      const market = await this.normalMarketModel.findById(marketId);
      if (!market) {
        throw new NotFoundException(`Market with ID ${marketId} not found`);
      }
      
      
      const marketOwnerId = market.owner.toString();
      if (marketOwnerId !== requestUserId) {
        throw new ForbiddenException('You are not authorized to transfer tokens from this market');
      }
      
      // Get the owner details
      const owner = await this.userModel.findById(market.owner);
      if (!owner) {
        throw new NotFoundException(`Owner account for market ${marketId} not found`);
      }

      if (!owner.headerAccountId || !owner.privateKey) {
        throw new ForbiddenException('Owner does not have valid Hedera credentials');
      }

      try {
        const payload = {
          senderAccountId: market.marketWalletPublicKey,
          senderPrivateKey: market.marketWalletSecretKey,
          receiverAccountId: owner.headerAccountId,
          amount: amount,
        };
        const response = await axios.post('https://hserv.onrender.com/api/token/transfer', payload);


      return {
        success: true,
        message: `Successfully transferred ${amount} HC from market to owner`,
        marketId: marketId,
        ownerId: owner._id,
        ownerHederaId: owner.headerAccountId,
        transactionDetails: response.data,
      };
    } catch (error) {
      console.error('Error transferring tokens:', error);
      
      return {
        success: false,
        message: 'Failed to transfer tokens',
        error: error.message,
      };
    }
    
  }
  catch (error) {
    console.error('Error in transferTokensToOwner:', error);
    throw new BadRequestException(`Failed to transfer tokens: ${error.message}`);
  }
}

async listSharesForSale(
  marketId: string,
  sellerId: string,
  shares: number,
  pricePerShare: number
): Promise<ShareSaleListing> {
  // 1. Find the market, check owner and enough shares
  const market = await this.normalMarketModel.findById(marketId);
  if (!market) throw new NotFoundException("Market not found");
  if (market.owner.toString() !== sellerId)
    throw new ForbiddenException("Only the owner can list shares for sale");
  if (market.fractions < shares)
    throw new BadRequestException("Not enough shares to list");

  // 2. Reduce owner’s available shares (optional: lock until sale/cancel)
  market.fractions -= shares;
  await market.save();

  // 3. Create a sale listing
  const saleListing = new this.saleListingModel({
    market: market._id,
    seller: sellerId,
    sharesForSale: shares,
    pricePerShare,
    isSold: false,
  });
  return await saleListing.save();
}


async buyShares(listingId: string, buyerId: string, amountPaid: number): Promise<any> {
  // 1. Find the listing
  const listing = await this.saleListingModel.findById(listingId).populate('market');
  if (!listing || listing.isSold) throw new NotFoundException("Listing not available");

  // 2. Find the buyer user
const user = await this.userModel.findById(buyerId);
if (!user) throw new NotFoundException('Buyer not found');

  if (!user.headerAccountId || !user.privateKey) {
    throw new BadRequestException("Buyer Hedera account or private key missing.");
  }

  // 3. Find the market/shop
  const sellingshop = await this.normalMarketModel.findById(listing.market._id);
  if (!sellingshop) throw new NotFoundException("Market not found.");
  if (!sellingshop.marketWalletPublicKey) {
    throw new BadRequestException("Market does not have a wallet public key.");
  }

  // 4. Calculate and validate total price
  const totalPrice =  listing.pricePerShare;
  if (amountPaid < totalPrice)
    throw new BadRequestException("Insufficient payment for shares");

  // 5. (Handle payment here! You must securely transfer the funds)
  const payload1 = {
    senderAccountId: user.headerAccountId,
    senderPrivateKey: user.privateKey,
    receiverAccountId: sellingshop.marketWalletPublicKey,
    amount: amountPaid,
  };
  const response1 = await axios.post('https://hserv.onrender.com/api/token/transfer', payload1);
  // 3. Transfer shares from market (seller) to buyer (invoke your shareFractionalNFT or similar logic)
  await this.shareFractionalNFT(
    listing.market._id.toString(),
    {
      percentage: (listing.sharesForSale / 10000) * 100, // adjust as needed for your shares-to-percentage logic,
      recipientAddress: buyerId, 
      recipientType: 'user'
    },
    listing.seller.toString()
  );

  // 4. Mark listing as sold, set buyer
  listing.isSold = true;
  listing.buyer = new Types.ObjectId(buyerId);
  await listing.save();

  return { success: true, message: "Shares bought successfully" };
}

async getAllSharesOnSale(): Promise<ShareSaleListing[]> {
  return this.saleListingModel.find({ isSold: false }).populate('market').populate('seller').exec();
}
async deleteListing(id: string, userId: string): Promise<{ deleted: boolean; sharesReturned: number }> {
  const listing = await this.saleListingModel.findById(id);
  if (!listing) return { deleted: false, sharesReturned: 0 };

  // Defensive: check seller existence and type
  if (!listing.seller) {
    throw new ForbiddenException('Listing has no seller');
  }
  if (!userId) {
    throw new ForbiddenException('No user id provided');
  }
  if (listing.seller.toString() !== userId.toString()) {
    throw new ForbiddenException('Not owner');
  }

  let sharesReturned = 0;
  if (!listing.isSold) {
    sharesReturned = listing.sharesForSale ?? 0;
    // Defensive: check market existence before updating
    if (!listing.market) {
      throw new NotFoundException('Listing has no market reference');
    }
    await this.normalMarketModel.findByIdAndUpdate(
      listing.market,
      { $inc: { fractions: sharesReturned } }
    );
  }

  await this.saleListingModel.deleteOne({ _id: id });
  return { deleted: true, sharesReturned };
}

  // Update only if user is owner, and allow updating any field (no DTO)
  async updateListing(id: string, updateData: any, userId: string): Promise<ShareSaleListing> {
    const listing = await this.saleListingModel.findById(id);
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.seller?.toString() !== userId.toString()) throw new ForbiddenException('Not owner');
    Object.assign(listing, updateData);
    await listing.save();
    return listing;
  }
  
}