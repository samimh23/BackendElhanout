import { SchemaFactory } from "@nestjs/mongoose";
import { User } from "./user.schema";

export class Client extends User{

}

export const ClientShcema = SchemaFactory.createForClass(Client);