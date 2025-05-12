import { Injectable, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/Schemas/User.schema';
import axios from 'axios';
import { NormalMarket } from 'src/market/schema/normal-market.schema';

@Injectable()
export class HederaService {
  private readonly logger = new Logger(HederaService.name);
  private readonly baseUrl = 'https://hserv.onrender.com';

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(NormalMarket.name) private NormalMarket: Model<NormalMarket>
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

  async getMBalance(marketId: string) {
    try {
      const market = await this.NormalMarket.findById(marketId);
      
      if (!market) {
        throw new NotFoundException(`Market with ID ${marketId} not found`);
      }
      
      if (!market.marketWalletPublicKey || !market.marketWalletSecretKey) {
        this.logger.warn(`Market ${marketId} does not have Hedera credentials`);
        return { balance: 0, accountId: null, timestamp: new Date().toISOString() };
      }
      
      const accountId = market.marketWalletPublicKey;
      const privateKey = market.marketWalletSecretKey;
      
      this.logger.log(`Fetching balance for market account: ${accountId}`);
      
      const response = await axios.post(
        `${this.baseUrl}/api/token/balance`,
        { accountId, privateKey },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      // Extract and filter for HC token specifically
      let hcTokenBalance = 0;
      
      if (response.data) {
        if (Array.isArray(response.data.tokenBalances)) {
          // Find HC token in tokenBalances array
          const hcToken = response.data.tokenBalances.find(
            (token) => token.tokenId === '0.0.5883473'
          );
          
          if (hcToken) {
            hcTokenBalance = parseInt(hcToken.balance) || 0;
            this.logger.log(`Found HC token balance: ${hcTokenBalance} for market: ${marketId}`);
          }
        } else if (typeof response.data === 'object' && response.data.balance) {
          // Assume this is the HC token balance if specific token data not available
          hcTokenBalance = parseInt(response.data.balance) || 0;
          this.logger.log(`Using direct balance value: ${hcTokenBalance} for market: ${marketId}`);
        } else if (typeof response.data === 'number' || typeof response.data === 'string') {
          // Direct value response
          hcTokenBalance = parseInt(response.data.toString()) || 0;
        }
      }
      
      // Return a simplified response with just the HC token balance
      return { 
        balance: hcTokenBalance,
        accountId: accountId,
        timestamp: new Date().toISOString() 
      };
    } catch (error) {
      this.logger.error(`Failed to get market balance for ${marketId}: ${error.message}`);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to fetch Hedera balance');
    }
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
  async getTokenOwnership(tokenId: string) {
    if (!tokenId) {
      throw new Error('Token ID is required');
    }
    let url = `https://testnet.mirrornode.hedera.com/api/v1/tokens/${tokenId}/balances?limit=100`;
    let balances: any[] = [];

    while (url) {
      const { data } = await axios.get(url);
      balances = balances.concat(data.balances || []);
      url = data.links?.next ? `https://testnet.mirrornode.hedera.com${data.links.next}` : '';
    }
    const totalShares = balances.reduce((sum, item) => sum + item.balance, 0);

    return {
      tokenId,
      totalShares,
      ownershipDistribution: balances.map(b => ({
        accountId: b.account,
        shares: b.balance,
        percentage: totalShares > 0 ? (b.balance / totalShares) * 100 : 0,
      })),
    };
  }

async getFirstTokenAcquisitionTimes(tokenId: string) {
  const BASE = 'https://testnet.mirrornode.hedera.com';
  const balances = await axios.get(`${BASE}/api/v1/tokens/${tokenId}/balances`);
  const accounts = balances.data.balances.map((b: any) => b.account);

  // Helper to decode Hedera timestamp to ISO string
  function decodeHederaTimestamp(ts: string): string {
    if (!ts) return null;
    const [seconds] = ts.split('.');
    return new Date(Number(seconds) * 1000).toISOString();
  }

  // Find first acquisition and parent for each account
  const infoList: {
    account: string,
    firstReceivedAt: string | null,
    firstReceivedAtISO: string | null,
    parent: string | null
  }[] = [];

  for (const account of accounts) {
    let found = false;
    let nextLink = `${BASE}/api/v1/transactions?account.id=${account}&order=asc&limit=100`;
    while (nextLink && !found) {
      const { data } = await axios.get(nextLink);
      for (const tx of data.transactions) {
        if (tx.token_transfers) {
          for (const xfer of tx.token_transfers) {
            if (
              xfer.token_id === tokenId &&
              xfer.account === account &&
              Number(xfer.amount) > 0
            ) {
              // Find the sender
              const parentXfer = tx.token_transfers.find(
                (t: any) =>
                  t.token_id === tokenId &&
                  Number(t.amount) < 0
              );
              infoList.push({
                account,
                firstReceivedAt: tx.consensus_timestamp,
                firstReceivedAtISO: decodeHederaTimestamp(tx.consensus_timestamp),
                parent: parentXfer?.account ?? null
              });
              found = true;
              break;
            }
          }
        }
        if (found) break;
      }
      nextLink = data.links?.next ? `${BASE}${data.links.next}` : null;
    }
    if (!found) {
      infoList.push({
        account,
        firstReceivedAt: null,
        firstReceivedAtISO: null,
        parent: null
      });
    }
  }

  // Build the parent->children tree
  const nodeMap: Record<string, any> = {};
  for (const info of infoList) {
    nodeMap[info.account] = { ...info, children: [] };
  }
  let roots: any[] = [];
  for (const info of infoList) {
    if (info.parent && nodeMap[info.parent]) {
      nodeMap[info.parent].children.push(nodeMap[info.account]);
    } else {
      roots.push(nodeMap[info.account]);
    }
  }

  // If only one root, return it directly, else return array of trees
  return roots.length === 1 ? roots[0] : roots;
}
}
