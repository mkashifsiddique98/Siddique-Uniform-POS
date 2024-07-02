import { School } from "@/types/school-name";
import mongoose, { Schema } from "mongoose";


interface ISchool extends School {}

const schoolNameSchema: Schema = new Schema({
  name: { type: String },
  location: { type: String },
});

const SchoolName =
  (mongoose.models.SchoolName as mongoose.Model<ISchool>) ||
  mongoose.model<ISchool>("SchoolName", schoolNameSchema);

export default SchoolName;
