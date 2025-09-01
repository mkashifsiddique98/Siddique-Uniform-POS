// models/ExpenseCategory.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IExpenseCategory extends Document {
  name: string;
}

const ExpenseCategorySchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
});

const ExpenseCategory = mongoose.models.ExpenseCategory || mongoose.model("ExpenseCategory", ExpenseCategorySchema);

export default ExpenseCategory;