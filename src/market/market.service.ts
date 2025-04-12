import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { NormalMarket } from "./schema/normal-market.schema";
import { CreateMarketDto } from "./dto/create-market.dto";
import { UpdateMarketDto } from "./dto/update-market.dto";
import { ShareFractionDto } from "./dto/ShareFraction.dto";
import { User } from "src/users/Schemas/User.schema";
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import * as dotenv from 'dotenv';

// Import Hedera SDK components needed for account creation
import {
  Client,
  PrivateKey,
  AccountBalanceQuery,
  AccountCreateTransaction,
  Hbar,
  TransferTransaction
} from "@hashgraph/sdk";

dotenv.config();

// Define interfaces for API responses
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
    private readonly httpService: HttpService
  ) {
    // Initialize connection to Hedera - still needed for basic operations
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

    // Set NFT API URL from environment or use default
    this.nftApiUrl = process.env.NFT_API_URL || 'http://localhost:3001/api';
    this.logger.log(`✅ Using NFT API at: ${this.nftApiUrl}`);
    
    // Check the operator balance on startup
    this.checkOperatorBalance();
  }

  // Check and log operator account balance
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

  // Create a new Hedera account for the market
  private async createMarketAccount(marketName: string): Promise<{ accountId: string, privateKey: string }> {
    try {
      this.logger.log(`Creating new Hedera account for market: ${marketName}`);
      
      // Generate a new key pair for the account
      const marketPrivateKey = PrivateKey.generateED25519();
      const marketPublicKey = marketPrivateKey.publicKey;
      
      // Create a new account and specify the initial balance
      // We'll transfer 5 HBAR from the main account to this new account
      const initialBalance = 5; // Initial balance in HBAR
      
      // Create the transaction
      const transaction = new AccountCreateTransaction()
        .setKey(marketPublicKey)
        .setInitialBalance(new Hbar(initialBalance))
        .freezeWith(this.client);
      
      // Sign and submit the transaction
      const signedTx = await transaction.sign(this.operatorKey);
      const txResponse = await signedTx.execute(this.client);
      
      // Get the receipt and the new account ID
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
      // Create a dedicated Hedera account for this market
      const marketAccount = await this.createMarketAccount(createNormalMarketDto.marketName);
      
      this.logger.log(`✅ Generated Hedera account for market: ${marketAccount.accountId}`);
      
      // Initialize with default values
      let fractionalNFTAddress = "PENDING_CREATION";
      let fractions = 10000; // 10000 shares = 100% ownership initially
      
      // Store market information in the database including the Hedera account details
      const newMarket = new this.normalMarketModel({
        ...createNormalMarketDto,
        marketWalletPublicKey: marketAccount.accountId, // Use account ID as public key identifier
        marketWalletSecretKey: marketAccount.privateKey, // Store the private key securely
        fractionalNFTAddress: fractionalNFTAddress,
        fractions: fractions,
        owner: new Types.ObjectId(userId),
        marketType: 'normal'
      });
  
      // Save the market to get an ID before creating NFT
      const savedMarket = await newMarket.save();
      this.logger.log(`✅ Market saved to database with ID: ${savedMarket._id}`);
      
      // Create NFT and fractional token via API for this market account
      try {
        // Create the fractional token via API for this market account
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
        
        // Update the market with the token ID from the API response
        savedMarket.fractionalNFTAddress = response.data.data.tokenId;
        await savedMarket.save();
        
        this.logger.log(`✅ Created fractional token (${response.data.data.tokenId}) for market via API`);
      } catch (error) {
        this.logger.warn(`⚠️ Could not create token automatically: ${error.message}. Market created without token.`);
      }
      
      // Update the user's markets array with this new market ID
      try {
        const marketId = savedMarket._id;
        const user = await this.userModel.findById(userId);
        
        if (!user) {
          throw new Error(`User with ID ${userId} not found`);
        }
        
        // Ensure markets array exists and add the market ID
        if (!user.markets) {
          user.markets = [];
        }
        
        // Add the market ID as a properly typed ObjectId
        user.markets.push(marketId);
        await user.save();
        
        this.logger.log(`✅ Added market ${marketId} to user ${userId}'s markets array`);
      } catch (updateError) {
        this.logger.error(`⚠️ Failed to update user's markets array: ${updateError.message}`, updateError.stack);
        // We don't throw here to avoid failing the entire market creation process
      }
      return savedMarket;
    } catch (error) {
      this.logger.error('Failed to create market:', error);
      throw new BadRequestException(`Failed to create market: ${error.message}`);
    }
  }

  // Method to manually create token for an existing market
  async createTokenForExistingMarket(marketId: string, userId: string): Promise<NormalMarket> {
    const market = await this.normalMarketModel.findById(marketId);
    if (!market) {
      throw new NotFoundException("Market not found");
    }
    
    // Check ownership
    if (market.owner && market.owner.toString() !== userId) {
      throw new BadRequestException("You don't have permission to create token for this market");
    }
    
    // Skip if the market already has a token
    if (market.fractionalNFTAddress && market.fractionalNFTAddress !== "PENDING_CREATION") {
      return market;
    }
    
    try {
      // Call the token creation API using the market's Hedera account
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
      
      // Update the market with the token ID from the API response
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
    // Validate input
    if (shareData.percentage <= 0 || shareData.percentage > 100) {
      throw new BadRequestException('Percentage must be between 0 and 100');
    }
    
    this.logger.log(`Starting share of ${shareData.percentage}% tokens to ${shareData.recipientAddress}`);
    
    // Find the market
    const market = await this.normalMarketModel.findById(marketId);
    if (!market) {
      throw new NotFoundException("Market not found");
    }
    
    // Check ownership
    if (market.owner && market.owner.toString() !== userId) {
      throw new BadRequestException("You don't have permission to share token for this market");
    }
    
    // Verify the market has a valid fractional token
    if (!market.fractionalNFTAddress || market.fractionalNFTAddress === "PENDING_CREATION") {
      throw new BadRequestException("This market doesn't have a valid fractional token yet");
    }
    
    try {
      // Variable to store recipient's Hedera account ID and private key
      let recipientHederaId: string = shareData.recipientAddress;
      let recipientPrivateKey: string | undefined;
      
      // Check if the recipientAddress is a direct Hedera account ID
      const isDirectHederaAccount = /^0\.0\.\d+$/.test(shareData.recipientAddress);
      
      if (isDirectHederaAccount) {
        this.logger.log(`Direct Hedera account ID provided: ${recipientHederaId}. Looking up in database...`);
        
        // Try to find this Hedera account in our user collection
        const userWithAccount = await this.userModel.findOne({ accounthederaid: recipientHederaId });
        if (userWithAccount?.privateKey) {
          recipientPrivateKey = userWithAccount.privateKey;
          this.logger.log(`Found matching user with this Hedera account in database`);
        } else {
          // Try to find this Hedera account in our market collection
          const marketWithAccount = await this.normalMarketModel.findOne({ marketWalletPublicKey: recipientHederaId });
          if (marketWithAccount?.marketWalletSecretKey) {
            recipientPrivateKey = marketWithAccount.marketWalletSecretKey;
            this.logger.log(`Found matching market with this Hedera account in database`);
          } else {
            this.logger.log(`No matching account found in database for ${recipientHederaId}`);
          }
        }
      }
      else if (Types.ObjectId.isValid(shareData.recipientAddress)) {
        // Handle recipient by ObjectId (existing code)
        const originalRecipientId = shareData.recipientAddress;
        let recipientType = shareData.recipientType || null;
        
        this.logger.log(`Recipient type specified as: ${recipientType || 'not specified - will try to detect'}`);
        
        if (recipientType === 'user') {
          const user = await this.userModel.findById(shareData.recipientAddress);
          if (user?.headerAccountId && user?.privateKey) {
            recipientHederaId = user.headerAccountId;
            recipientPrivateKey = user.privateKey;
            this.logger.log(`Found user recipient with Hedera account: ${recipientHederaId}`);
          } else {
            throw new BadRequestException(`User ${shareData.recipientAddress} doesn't have a Hedera account configured`);
          }
        } 
        else if (recipientType === 'market') {
          const recipientMarket = await this.normalMarketModel.findById(shareData.recipientAddress);
          if (recipientMarket?.marketWalletPublicKey && recipientMarket?.marketWalletSecretKey) {
            recipientHederaId = recipientMarket.marketWalletPublicKey;
            recipientPrivateKey = recipientMarket.marketWalletSecretKey;
            this.logger.log(`Found market recipient with Hedera account: ${recipientHederaId}`);
          } else {
            throw new BadRequestException(`Market ${shareData.recipientAddress} doesn't have a valid Hedera account`);
          }
        }
        // If no type specified, try both but give priority to users
        else {
          // Try user first
          const user = await this.userModel.findById(shareData.recipientAddress);
          if (user?.headerAccountId && user?.privateKey) {
            recipientHederaId = user.headerAccountId;
            recipientPrivateKey = user.privateKey;
            this.logger.log(`Found user recipient with Hedera account: ${recipientHederaId}`);
          } else {
            // Try market next
            const recipientMarket = await this.normalMarketModel.findById(shareData.recipientAddress);
            if (recipientMarket?.marketWalletPublicKey && recipientMarket?.marketWalletSecretKey) {
              recipientHederaId = recipientMarket.marketWalletPublicKey;
              recipientPrivateKey = recipientMarket.marketWalletSecretKey;
              this.logger.log(`Found market recipient with Hedera account: ${recipientHederaId}`);
            } else {
              throw new BadRequestException(`Recipient ${shareData.recipientAddress} not found or doesn't have a valid Hedera account`);
            }
          }
        }
        
        this.logger.log(`Translated recipient ID ${originalRecipientId} to Hedera account ${recipientHederaId}`);
      } else {
        // Invalid format
        throw new BadRequestException(`Invalid recipient address format. Must be a valid ObjectId or Hedera account ID (0.0.XXXX).`);
      }
  
      // If we found the private key, first try to associate the token
      if (recipientPrivateKey) {
        try {
          this.logger.log(`Attempting to associate token ${market.fractionalNFTAddress} with recipient ${recipientHederaId} before transfer...`);
          this.logger.log(`Using recipient's private key for association`);
          
          // Call the API to associate the token first
          const associateData = {
            tokenId: market.fractionalNFTAddress,
            accountId: recipientHederaId,
            privateKey: recipientPrivateKey
          };
          
          const associateResponse = await firstValueFrom(
            this.httpService.post(`${this.nftApiUrl}/associate`, associateData)
          );
          
          this.logger.log(`Token association response: ${JSON.stringify(associateResponse.data)}`);
        } catch (associateError) {
          // If the error is 'already associated', that's fine, continue
          if (associateError.response?.data?.message?.includes('already associated')) {
            this.logger.log(`Token is already associated with recipient account - proceeding with transfer`);
          } else {
            this.logger.warn(`Token association attempt failed: ${associateError.message}. Will try direct transfer anyway.`);
            
            // Log more details about the error
            if (associateError.response?.data) {
              this.logger.error(`Association API error details: ${JSON.stringify(associateError.response.data)}`);
            }
          }
        }
      } else {
        this.logger.warn(`No private key found for Hedera account ${recipientHederaId}. Token association may fail if not previously done.`);
      }
      
      // Call the API to share ownership
      const requestData = {
        tokenId: market.fractionalNFTAddress,
        recipientId: recipientHederaId,
        percentageToShare: shareData.percentage,
        marketAccountId: market.marketWalletPublicKey,
        marketPrivateKey: market.marketWalletSecretKey,
      };
      
      // Only include recipientPrivateKey if we have it
      if (recipientPrivateKey) {
        requestData['recipientPrivateKey'] = recipientPrivateKey;
      }
      
      // Log request data (with sensitive information redacted)
      this.logger.log(`Calling NFT API at ${this.nftApiUrl}/share with recipient: ${recipientHederaId}`);
      this.logger.log(`Request data: ${JSON.stringify({
        ...requestData, 
        marketPrivateKey: '[REDACTED]', 
        recipientPrivateKey: recipientPrivateKey ? '[REDACTED]' : undefined
      })}`);
      
      const response: AxiosResponse<ShareResponse> = await firstValueFrom(
        this.httpService.post<ShareResponse>(`${this.nftApiUrl}/share`, requestData)
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Share operation failed');
      }
      
      // Update the market's remaining fractions in database
      const result = response.data.data;
      const remainingShares = result.sender.shares;
      
      await this.normalMarketModel.findByIdAndUpdate(marketId, {
        fractions: remainingShares
      });
      
      // Log recipient ownership for tracking
      this.logger.log(`✅ Successfully shared ${shareData.percentage}% ownership with ${recipientHederaId}`);
      this.logger.log(`Recipient now has ${result.recipient.shares} shares (${result.recipient.percentage.toFixed(2)}%)`);
      
      return {
        success: true,
        transactionId: result.transactionId || 'API_TRANSACTION',
        recipientHederaId: recipientHederaId
      };
    } catch (error) {
      this.logger.error('Failed to share fractional token:', error);
      
      // Handle token association errors specifically
      if (error.response?.data) {
        this.logger.error(`API error details: ${JSON.stringify(error.response.data)}`);
        
        if (error.response.data.message?.includes('TOKEN_NOT_ASSOCIATED_TO_ACCOUNT')) {
          throw new BadRequestException(
            `Token association required: The recipient account ${error.response.data.message.match(/account\s+([0-9.]+)/)?.[1] || shareData.recipientAddress} must be associated with the token ${market.fractionalNFTAddress} first. ` +
            `Please associate the token before transferring or provide an account with pre-associated token.`
          );
        }
      }
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException(`Failed to share fractional token: ${error.message}`);
    }
  }
  
  // Method to check token ownership distribution
  async checkTokenOwnership(marketId: string): Promise<any[]> {
    try {
      // Get the market to find its token
      const market = await this.normalMarketModel.findById(marketId);
      if (!market || !market.fractionalNFTAddress) {
        throw new NotFoundException("Market or fractional token not found");
      }
      
      // Call the API to check ownership with proper typing
      const response: AxiosResponse<OwnershipResponse> = await firstValueFrom(
        this.httpService.get<OwnershipResponse>(
          `${this.nftApiUrl}/check?tokenId=${market.fractionalNFTAddress}&marketAccountId=${market.marketWalletPublicKey}`
        )
      );
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Check ownership operation failed');
      }
      
      // Update the market's fraction count
      const ownershipDistribution = response.data.data.ownershipDistribution;
      
      // Find the market account's ownership and update fractions
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

  // Add funds to market account
  async fundMarketAccount(marketId: string, userId: string, amountInHbar: number): Promise<any> {
    // Find the market
    const market = await this.normalMarketModel.findById(marketId);
    if (!market) {
      throw new NotFoundException("Market not found");
    }
    
    // Check ownership
    if (market.owner && market.owner.toString() !== userId) {
      throw new BadRequestException("You don't have permission to fund this market");
    }
    
    try {
      // Transfer HBAR to the market account
      const transferTx = await new TransferTransaction()
        .addHbarTransfer(this.operatorId, new Hbar(-amountInHbar))
        .addHbarTransfer(market.marketWalletPublicKey, new Hbar(amountInHbar))
        .freezeWith(this.client);
      
      const signedTx = await transferTx.sign(this.operatorKey);
      const txResponse = await signedTx.execute(this.client);
      const receipt = await txResponse.getReceipt(this.client);
      
      this.logger.log(`✅ Successfully funded market account ${market.marketWalletPublicKey} with ${amountInHbar} HBAR`);
      
      // Get the new balance
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

  // Standard CRUD methods with ownership checks
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
    
    // Convert userId to string and compare with market.owner.toString()
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
    
    // Check if the requesting user is the owner
    if (existingMarket.owner && existingMarket.owner.toString() !== userId) {
      throw new BadRequestException("You don't have permission to delete this market");
    }
    
    return this.normalMarketModel.findByIdAndDelete(id).exec();
  }

  async getMarketsByOwner(ownerId: string): Promise<NormalMarket[]> {
    this.logger.log(`Fetching markets for owner with ID: ${ownerId}`);
    
    // Verify valid ObjectId to prevent DB errors
    if (!Types.ObjectId.isValid(ownerId)) {
      throw new BadRequestException('Invalid owner ID format');
    }
    
    // Convert string ID to ObjectId for MongoDB query
    const ownerObjectId = new Types.ObjectId(ownerId);
    
    // Query the database for markets with the specified owner
    const markets = await this.normalMarketModel.find({ 
      owner: ownerObjectId 
    }).exec();
    
    this.logger.log(`Found ${markets.length} markets for owner ${ownerId}`);
    return markets;
  }
}