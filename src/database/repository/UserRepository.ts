import { AppDataSource } from "../data-source";
import { User } from "../entity/User";

export const UserRepository = AppDataSource.getRepository(User).extend({
  async findByIrcIdentifier(ircIdentifier: string): Promise<User | null> {
    return this.findOne({ where: { ircIdentifier } });
  },

  async findOrCreate(ircIdentifier: string): Promise<User> {
    let user = await this.findByIrcIdentifier(ircIdentifier);
    
    if (!user) {
      user = this.create({ ircIdentifier });
      await this.save(user);
    }
    
    return user;
  }
}); 