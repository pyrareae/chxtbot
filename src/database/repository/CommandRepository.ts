import { AppDataSource } from "../data-source";
import { Command } from "../entity/Command";
import { User } from "../entity/User";

export const CommandRepository = AppDataSource.getRepository(Command).extend({
  async findByUser(user: User): Promise<Command[]> {
    return this.find({
      where: { user: { id: user.id } },
      relations: ["user"],
      order: { name: "ASC" }
    });
  },

  async findByName(name: string): Promise<Command | null> {
    return this.findOne({
      where: { name, isActive: true },
      relations: ["user"]
    });
  },

  async createCommand(user: User, name: string, code: string, description?: string): Promise<Command> {
    const command = this.create({
      name,
      code,
      description,
      user,
      userId: user.id
    });

    return this.save(command);
  },

  async updateCommand(id: number, name: string, code: string, isActive: boolean, description?: string): Promise<Command | null> {
    const command = await this.findOne({ where: { id } });
    
    if (!command) {
      return null;
    }
    
    command.name = name;
    command.code = code;
    command.isActive = isActive;
    
    if (description !== undefined) {
      command.description = description;
    }
    
    return this.save(command);
  },

  async deleteCommand(id: number): Promise<boolean> {
    const result = await this.delete(id);
    return result.affected !== 0;
  }
}); 