import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISizeTemplate extends Document {
  name: string;
  sizes: string[];
}

const sizeTemplateSchema: Schema<ISizeTemplate> = new Schema({
  name: { type: String, required: true },
  sizes: { type: [String], required: true },
});

const SizeTemplate: Model<ISizeTemplate> = mongoose.models.SizeTemplate || mongoose.model<ISizeTemplate>('SizeTemplate', sizeTemplateSchema);

export default SizeTemplate;
