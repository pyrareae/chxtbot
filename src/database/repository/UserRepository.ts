import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import crypto from "crypto";

export const UserRepository = AppDataSource.getRepository(User).extend({
  async findByIrcAccount(ircAccount: string): Promise<User | null> {
    return this.findOne({ where: { ircAccount } });
  },

  async findOrCreate(ircAccount: string): Promise<User> {
    let user = await this.findByIrcAccount(ircAccount);
    
    if (!user) {
      user = this.create({ ircAccount });
      await this.save(user);
    }
    
    return user;
  },
  
  async generateAuthToken(user: User): Promise<string> {
    // Create a random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Set expiry to 24 hours from now
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);
    
    // Save token to user record
    user.authToken = token;
    user.authTokenExpiry = expiry;
    await this.save(user);
    
    return token;
  },
  
  async verifyAuthToken(token: string): Promise<User | null> {
    const user = await this.findOne({ where: { authToken: token } });
    
    if (!user) return null;
    
    // Check if token is expired
    if (user.authTokenExpiry && user.authTokenExpiry < new Date()) {
      // Clear expired token
      user.authToken = undefined;
      user.authTokenExpiry = undefined;
      await this.save(user);
      return null;
    }
    
    return user;
  },
  
  async authenticateUser(user: User): Promise<User> {
    user.isAuthenticated = true;
    user.authToken = undefined;
    user.authTokenExpiry = undefined;
    await this.save(user);
    return user;
  }
}); 