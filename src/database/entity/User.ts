import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  ircAccount: string;
  
  @Column({ nullable: true })
  authToken: string;
  
  @Column({ nullable: true })
  authTokenExpiry: Date;
  
  @Column({ default: false })
  isAuthenticated: boolean;
  
  @CreateDateColumn()
  createdAt: Date;
  
  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany("Command", "user")
  commands: any[];
} 