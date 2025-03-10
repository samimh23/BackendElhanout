import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { NormalMarket } from "./schema/normal-market.schema";
import { CreateMarketDto } from "./dto/create-market.dto";
import { UpdateMarketDto } from "./dto/update-market.dto";
import { 
  Metaplex, 
  keypairIdentity, 
  toBigNumber 
} from "@metaplex-foundation/js";
import { 
  Connection, 
  Keypair, 
  LAMPORTS_PER_SOL, 
  PublicKey,
  Transaction,
  SystemProgram
} from "@solana/web3.js";
import {
  createTransferInstruction,
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction
} from "@solana/spl-token";
import * as dotenv from 'dotenv';
import * as bs58 from 'bs58';
import { ShareFractionDto } from "./dto/ShareFraction.dto";

dotenv.config();

// Define ShareFractionDto here to ensure it's available


@Injectable()
export class MarketService {
  private readonly connection: Connection;
  private readonly fundingKeypair: Keypair;
  
  constructor(
    @InjectModel(NormalMarket.name) private normalMarketModel: Model<NormalMarket>
  ) {
    // Initialize connection to Solana devnet
    this.connection = new Connection("https://api.devnet.solana.com");
    
    // Initialize funding wallet from environment variable
    const fundingPrivateKey = process.env.FUNDING_WALLET_PRIVATE_KEY;
    if (!fundingPrivateKey) {
      console.warn("⚠️ No funding wallet private key found in environment variables!");
      // Creating an empty keypair as fallback (will need manual funding)
      this.fundingKeypair = Keypair.generate();
    } else {
      try {
        // Convert private key from base58 format to Uint8Array for Keypair
        const decodedKey = bs58.decode(fundingPrivateKey);
        this.fundingKeypair = Keypair.fromSecretKey(decodedKey);
        console.log("✅ Successfully loaded funding wallet from .env");
      } catch (error) {
        console.error("Failed to initialize funding wallet:", error);
        // Fallback to generated keypair
        this.fundingKeypair = Keypair.generate();
      }
    }

    // Log the funding wallet address for convenience
    console.log(`✅ Funding wallet address: ${this.fundingKeypair.publicKey.toString()}`);
    
    // Check the funding wallet balance on startup
    this.checkFundingWalletBalance();
  }

  // Check and log funding wallet balance
  private async checkFundingWalletBalance() {
    try {
      const balance = await this.connection.getBalance(this.fundingKeypair.publicKey);
      console.log(`💰 Funding wallet balance: ${balance / LAMPORTS_PER_SOL} SOL`);
      
      if (balance < 0.06 * LAMPORTS_PER_SOL) {
        console.warn(`⚠️ WARNING: Funding wallet has low balance. Please fund this address: ${this.fundingKeypair.publicKey.toString()}`);
      }
    } catch (error) {
      console.error("Failed to check funding wallet balance:", error);
    }
  }
    // Create Market Entry with Wallet and optionally with NFT if funding available
    async create(createNormalMarketDto: CreateMarketDto): Promise<NormalMarket> {
      console.log("🎯 Creating Market:", createNormalMarketDto.marketName);
  
      try {
        // Generate a wallet for this market
        const marketKeypair = Keypair.generate();
        const publicKey = marketKeypair.publicKey.toString();
        const secretKey = Buffer.from(marketKeypair.secretKey).toString("base64");
        
        console.log(`✅ Generated new wallet: ${publicKey}`);
        
        // Initialize default values
        let fractionalNFTAddress = "PENDING_FUNDING_NEEDED";
        
        // Try to fund the wallet and create NFT but don't fail if funding isn't available
        try {
          // Check funding wallet balance first
          const funderBalance = await this.connection.getBalance(this.fundingKeypair.publicKey);
          
          if (funderBalance >= 0.06 * LAMPORTS_PER_SOL) {
            // Fund the new wallet from our funding wallet
            await this.fundNewWallet(marketKeypair.publicKey);
            
            // Create fractional NFT directly after funding
            const nftDetails = await this.createFractionalNFT(
              marketKeypair, 
              createNormalMarketDto.marketName,
              createNormalMarketDto.marketImage
            );
            
            // Update NFT address with the created value
            fractionalNFTAddress = nftDetails.tokenMintAddress;
          } else {
            console.warn(`⚠️ Funding wallet has insufficient balance (${funderBalance / LAMPORTS_PER_SOL} SOL). Creating market without NFT.`);
          }
        } catch (error) {
          // Log the funding/NFT error but continue with market creation
          console.warn(`⚠️ Could not create NFT automatically: ${error.message}. Creating market without NFT.`);
        }
        
        // Store all information in the database
        const newMarket = new this.normalMarketModel({
          ...createNormalMarketDto,
          marketWalletPublicKey: publicKey,
          marketWalletSecretKey: secretKey,
          fractionalNFTAddress: fractionalNFTAddress,
          fractions: 100, // Store the initial fractions (100%)
        });
  
        const savedMarket = await newMarket.save();
        console.log(`✅ Market created successfully with ID: ${savedMarket._id}`);
        
        // If NFT wasn't created, provide instructions for manual creation
        if (fractionalNFTAddress === "PENDING_FUNDING_NEEDED") {
          console.log(`ℹ️ NFT creation pending. To create NFT manually later, fund this wallet with at least 0.05 SOL: ${publicKey}`);
        }
        
        return savedMarket;
      } catch (error) {
        console.error('Failed to create market:', error);
        throw new BadRequestException(`Failed to create market: ${error.message}`);
      }
    }
  
    // Method to manually create NFT for an existing market after funding
    async createNFTForExistingMarket(marketId: string): Promise<NormalMarket> {
      const market = await this.normalMarketModel.findById(marketId);
      if (!market) {
        throw new NotFoundException("Market not found");
      }
      
      // Skip if the market already has an NFT
      if (market.fractionalNFTAddress && market.fractionalNFTAddress !== "PENDING_FUNDING_NEEDED") {
        return market;
      }
      
      const secretKeyUint8 = Buffer.from(market.marketWalletSecretKey, 'base64');
      const marketKeypair = Keypair.fromSecretKey(secretKeyUint8);
      
      // Check if wallet has been funded
      const balance = await this.connection.getBalance(marketKeypair.publicKey);
      if (balance < 0.05 * LAMPORTS_PER_SOL) {
        throw new BadRequestException(
          `Wallet has insufficient funds. Current balance: ${balance / LAMPORTS_PER_SOL} SOL. ` +
          `Please fund this address with at least 0.05 SOL: ${market.marketWalletPublicKey}`
        );
      }
      
      try {
        // Now create the NFT since the wallet has funds
        const nftDetails = await this.createFractionalNFT(
          marketKeypair,
          market.marketName,
          market.marketImage
        );
        
        // Update the market with the NFT address
        market.fractionalNFTAddress = nftDetails.tokenMintAddress;
        await market.save();
        
        return market;
      } catch (error) {
        console.error("Failed to create fractional NFT:", error);
        throw new BadRequestException(`Failed to create fractional NFT: ${error.message}`);
      }
    }
      // Helper to fund a new wallet with enough SOL for NFT operations
  private async fundNewWallet(destinationPubkey: PublicKey): Promise<void> {
    try {
      console.log(`Attempting to fund new wallet: ${destinationPubkey.toString()}`);
      console.log(`Using funding wallet: ${this.fundingKeypair.publicKey.toString()}`);
      
      // Check funding wallet balance first
      const funderBalance = await this.connection.getBalance(this.fundingKeypair.publicKey);
      console.log(`Current funding wallet balance: ${funderBalance / LAMPORTS_PER_SOL} SOL`);
      
      if (funderBalance < 0.06 * LAMPORTS_PER_SOL) {
        throw new BadRequestException(
          `Funding wallet has insufficient funds. Current balance: ${funderBalance / LAMPORTS_PER_SOL} SOL. ` +
          `Please fund this address with at least 0.06 SOL: ${this.fundingKeypair.publicKey.toString()}`
        );
      }
      
      // Create and build the transaction
      const transaction = new Transaction();
      
      // Add the transfer instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: this.fundingKeypair.publicKey,
          toPubkey: destinationPubkey,
          lamports: 0.05 * LAMPORTS_PER_SOL,
        })
      );
      
      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.fundingKeypair.publicKey;
      
      // Sign transaction
      transaction.sign(this.fundingKeypair);
      
      // Send raw transaction
      const rawTransaction = transaction.serialize();
      const signature = await this.connection.sendRawTransaction(rawTransaction);
      
      console.log(`Transaction sent with signature: ${signature}`);
      
      // Wait for confirmation
      const confirmation = await this.connection.confirmTransaction(signature, 'confirmed');
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }
      
      console.log(`✅ Funded new wallet with 0.05 SOL. Transaction: ${signature}`);
      
      // Verify the balance after funding
      const newBalance = await this.connection.getBalance(destinationPubkey);
      console.log(`New wallet balance: ${newBalance / LAMPORTS_PER_SOL} SOL`);
      
    } catch (error) {
      console.error('Failed to fund wallet:', error);
      throw new BadRequestException(`Failed to fund market wallet: ${error.message}`);
    }
  }

  // Helper to create fractional NFT
  private async createFractionalNFT(
    marketKeypair: Keypair,
    marketName: string,
    imageUri: string
  ): Promise<{ nftAddress: string, tokenMintAddress: string }> {
    try {
      // Initialize Metaplex
      const metaplex = Metaplex.make(this.connection).use(keypairIdentity(marketKeypair));
      
      console.log(`Creating NFT for market "${marketName}" with image: ${imageUri}`);
      const { nft } = await metaplex.nfts().create({
        uri: imageUri,
        name: marketName,
        sellerFeeBasisPoints: 500, // 5% royalty
      });
      
      console.log("✅ NFT Created:", nft.address.toString());
      
      // Create fractional tokens
      console.log("Creating fractional tokens...");
      const { token: mintedToken } = await metaplex.tokens().createTokenWithMint({
        initialSupply: {
          basisPoints: toBigNumber(100 * 100), // 100 fractions with 100 basis points each
          currency: {
            symbol: 'SPL',
            decimals: 0,
            namespace: 'spl-token'
          }
        },
        decimals: 0,
        mintAuthority: marketKeypair,
      });
      
      console.log("✅ Fractional Tokens Minted:", mintedToken.mint.address.toString());
      
      return {
        nftAddress: nft.address.toString(),
        tokenMintAddress: mintedToken.mint.address.toString()
      };
    } catch (error) {
      console.error("Failed to create fractional NFT:", error);
      throw new BadRequestException(`Failed to create fractional NFT: ${error.message}`);
    }
  }
    // Method to share fractional NFT with another wallet
   // Method to share fractional NFT with another wallet
/**
 * Share fractional tokens with another wallet
 * @param marketId The ID of the market containing the fractional NFT
 * @param shareData The recipient and percentage to share
 * @returns Success status and transaction ID
 */
async shareFractionalNFT(
  marketId: string,
  shareData: ShareFractionDto
): Promise<{ success: boolean; transactionId: string }> {
  // Validate input
  if (shareData.percentage <= 0 || shareData.percentage > 100) {
    throw new BadRequestException('Percentage must be between 0 and 100');
  }
  
  console.log(`Starting share of ${shareData.percentage}% tokens to ${shareData.recipientAddress}`);
  
  // Find the market
  const market = await this.normalMarketModel.findById(marketId);
  if (!market) {
    throw new NotFoundException("Market not found");
  }
  
  // Verify the market has a valid fractional NFT
  if (!market.fractionalNFTAddress || market.fractionalNFTAddress === "PENDING_FUNDING_NEEDED") {
    throw new BadRequestException("This market doesn't have a valid fractional NFT yet");
  }
  
  try {
    // Recreate the market wallet keypair
    const secretKeyUint8 = Buffer.from(market.marketWalletSecretKey, 'base64');
    const marketKeypair = Keypair.fromSecretKey(secretKeyUint8);
    
    // Parse recipient's address
    let recipientPubKey;
    try {
      recipientPubKey = new PublicKey(shareData.recipientAddress);
    } catch (error) {
      throw new BadRequestException(`Invalid recipient address: ${error.message}`);
    }
    
    // Parse the fractional token mint address
    const fractionalMint = new PublicKey(market.fractionalNFTAddress);
    
    // Get the sender's token account
    const senderTokenAccount = await getAssociatedTokenAddress(
      fractionalMint,
      marketKeypair.publicKey
    );
    
    // Check current token balance before proceeding
    let currentBalance;
    try {
      const tokenInfo = await this.connection.getTokenAccountBalance(senderTokenAccount);
      currentBalance = Number(tokenInfo.value.amount);
      console.log(`Current token balance: ${currentBalance} fractions`);
      
      // Update market.fractions if it doesn't match current balance
      if (market.fractions !== currentBalance) {
        console.log(`Updating market.fractions from ${market.fractions} to ${currentBalance}`);
        await this.normalMarketModel.findByIdAndUpdate(marketId, { fractions: currentBalance });
        market.fractions = currentBalance;
      }
    } catch (error) {
      console.error('Error getting token balance:', error);
      throw new BadRequestException('Failed to check token balance. The token account may not exist or market wallet has no tokens.');
    }
    
    // Calculate how many tokens to transfer based on percentage
    const tokensToTransfer = Math.floor((shareData.percentage * currentBalance) / 100);
    console.log(`Calculated tokens to transfer: ${tokensToTransfer} (${shareData.percentage}% of ${currentBalance})`);
    
    if (tokensToTransfer <= 0) {
      throw new BadRequestException('Percentage is too small to transfer any tokens, or no tokens available');
    }
    
    if (tokensToTransfer > currentBalance) {
      throw new BadRequestException(`Cannot transfer ${tokensToTransfer} tokens, only ${currentBalance} available`);
    }
    
    console.log('Market wallet:', marketKeypair.publicKey.toString());
    console.log('Recipient:', recipientPubKey.toString());
    console.log('Fractional mint:', fractionalMint.toString());
    
    // Get or create the recipient's token account
    const recipientTokenAccount = await getAssociatedTokenAddress(
      fractionalMint,
      recipientPubKey
    );
    
    // Create a new transaction
    const transaction = new Transaction();
    
    // Check if recipient's token account exists, if not create it
    try {
      const accountInfo = await this.connection.getAccountInfo(recipientTokenAccount);
      console.log('Recipient token account exists:', !!accountInfo);
      
      if (!accountInfo) {
        // Token account doesn't exist, add instruction to create it
        console.log('Creating associated token account for recipient');
        transaction.add(
          createAssociatedTokenAccountInstruction(
            marketKeypair.publicKey,  // payer
            recipientTokenAccount,    // associated token account address
            recipientPubKey,          // owner
            fractionalMint            // mint
          )
        );
      }
    } catch (error) {
      console.log('Creating associated token account for recipient (after error check)');
      // Token account doesn't exist, add instruction to create it
      transaction.add(
        createAssociatedTokenAccountInstruction(
          marketKeypair.publicKey,  // payer
          recipientTokenAccount,    // associated token account address
          recipientPubKey,          // owner
          fractionalMint            // mint
        )
      );
    }
    
    // Add the transfer instruction
    console.log(`Adding transfer instruction for ${tokensToTransfer} tokens`);
    transaction.add(
      createTransferInstruction(
        senderTokenAccount,      // source
        recipientTokenAccount,   // destination
        marketKeypair.publicKey, // owner
        tokensToTransfer         // amount
      )
    );
    
    // Check if sender has enough SOL for transaction fees
    const senderBalance = await this.connection.getBalance(marketKeypair.publicKey);
    const minimumSolBalance = 0.002 * LAMPORTS_PER_SOL; // 0.002 SOL for fees
    
    if (senderBalance < minimumSolBalance) {
      throw new BadRequestException(
        `Market wallet has insufficient SOL for transaction fees. Need at least 0.002 SOL, but has ${senderBalance / LAMPORTS_PER_SOL} SOL.`
      );
    }
    
    // Send and confirm the transaction with multiple attempts
    const { signature, confirmed } = await this.sendTransactionWithRetry(transaction, marketKeypair);
    
    if (!confirmed) {
      throw new BadRequestException('Transaction sent but confirmation failed or timed out');
    }
    
    // Update the market's remaining fractions in database
    const remainingFractions = currentBalance - tokensToTransfer;
    await this.normalMarketModel.findByIdAndUpdate(marketId, {
      fractions: remainingFractions
    });
    
    console.log(`✅ Successfully shared ${tokensToTransfer} fractional tokens (${shareData.percentage}%) with ${shareData.recipientAddress}`);
    console.log(`Transaction signature: ${signature}`);
    
    return {
      success: true,
      transactionId: signature
    };
  } catch (error) {
    console.error('Failed to share fractional NFT:', error);
    
    // Enhanced error handling with more specific messages
    if (error instanceof BadRequestException) {
      throw error;
    }
    
    if (error.message && error.message.includes('Blockhash not found')) {
      throw new BadRequestException('Failed to share fractional NFT: Solana network connection issue. Please try again later.');
    }
    
    throw new BadRequestException(`Failed to share fractional NFT: ${error.message}`);
  }
}

/**
 * Helper method to send and confirm a transaction with multiple retry attempts
 */
private async sendTransactionWithRetry(
  transaction: Transaction,
  signer: Keypair,
  maxAttempts = 3
): Promise<{ signature: string; confirmed: boolean }> {
  let signature = '';
  let confirmed = false;
  let attempts = 0;
  
  while (attempts < maxAttempts && !confirmed) {
    try {
      console.log(`Transaction attempt ${attempts + 1}/${maxAttempts}`);
      
      // Get a fresh blockhash for each attempt
      const { blockhash, lastValidBlockHeight } = 
        await this.connection.getLatestBlockhash('confirmed');
      
      console.log(`Got blockhash: ${blockhash}, valid until height: ${lastValidBlockHeight}`);
      
      // Reset transaction
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = signer.publicKey;
      
      // Clear previous signatures if retrying
      if (attempts > 0) {
        transaction.signatures = [];
      }
      
      // Sign and send transaction
      transaction.sign(signer);
      signature = await this.connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });
      
      console.log(`Transaction sent with signature: ${signature}`);
      
      // Wait for confirmation with a reasonable timeout
      const confirmation = await this.connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');
      
      if (confirmation.value.err) {
        console.error(`Transaction confirmed but has error: ${JSON.stringify(confirmation.value.err)}`);
        throw new Error(`Transaction error: ${JSON.stringify(confirmation.value.err)}`);
      }
      
      confirmed = true;
      console.log('Transaction confirmed successfully!');
      return { signature, confirmed };
      
    } catch (error) {
      attempts++;
      console.error(`Attempt ${attempts} failed:`, error);
      
      if (attempts >= maxAttempts) {
        throw error;
      }
      
      // Wait before retrying with an increasing delay
      const delay = attempts * 2000;
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return { signature, confirmed };
}
    // Other standard methods
    async findAll(): Promise<NormalMarket[]> {
      return this.normalMarketModel.find().exec();
    }
  
    async findOne(id: string): Promise<NormalMarket> {
      return this.normalMarketModel.findById(id).exec();
    }
  
    async update(id: string, updateNormalMarketDto: UpdateMarketDto): Promise<NormalMarket> {
      const existingMarket = await this.normalMarketModel.findById(id);
      if (!existingMarket) throw new NotFoundException("Market not found");
      return this.normalMarketModel.findByIdAndUpdate(id, updateNormalMarketDto, { new: true }).exec();
    }
  
    async remove(id: string): Promise<NormalMarket> {
      return this.normalMarketModel.findByIdAndDelete(id).exec();
    }
  }