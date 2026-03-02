import { z } from "zod";

export const registerSchema = z
  .object({
    name: z
      .string({ required_error: "Tên là bắt buộc" })
      .trim()
      .min(1, "Tên là bắt buộc")
      .min(6, "Tên phải có ít nhất 6 ký tự")
      .max(50, "Tên tối đa 50 ký tự"),

    email: z
      .string({ required_error: "Email là bắt buộc" })
      .trim()
      .min(1, "Email là bắt buộc")
      .email("Địa chỉ email không hợp lệ"),

    password: z
      .string({ required_error: "Mật khẩu là bắt buộc" })
      .min(1, "Mật khẩu là bắt buộc")
      .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),

    confirmPassword: z
      .string({ required_error: "Xác nhận mật khẩu là bắt buộc" })
      .min(1, "Xác nhận mật khẩu là bắt buộc"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email là bắt buộc" })
    .trim()
    .min(1, "Email là bắt buộc")
    .email("Địa chỉ email không hợp lệ"),

  password: z
    .string({ required_error: "Mật khẩu là bắt buộc" })
    .min(1, "Mật khẩu là bắt buộc")
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
});
