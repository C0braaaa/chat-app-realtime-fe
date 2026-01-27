import { z } from "zod";

export const registerSchema = z
  .object({
    name: z
      .string({ required_error: "Name is required" })
      .trim() // Xóa khoảng trắng thừa 2 đầu
      .min(1, "Name is required")
      .min(6, "Name must be at least 6 characters") // Kiểm tra độ dài trước
      .max(50, "Name must be at most 50 characters"),

    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .min(1, "Email is required")
      .email("Invalid email address"),

    password: z
      .string({ required_error: "Password is required" })
      .min(1, "Password is required") // Quan trọng: Để cuối để ưu tiên hiển thị
      .min(6, "Password must be at least 6 characters"),

    confirmPassword: z
      .string({ required_error: "Confirm password is required" })
      .min(1, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address"),

  password: z
    .string({ required_error: "Password is required" })
    .min(1, "Password is required") // Quan trọng: Để cuối để ưu tiên hiển thị
    .min(6, "Password must be at least 6 characters"),
});
