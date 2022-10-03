import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Barrells {
  @Prop()
  downloadsAllTime: number;
  @Prop()
  name: string;
}
export type BarrellsDocument = Barrells & Document;
export const BarrellsSchema = SchemaFactory.createForClass(Barrells);
