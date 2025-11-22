import { AppError } from '../middleware/errorHandler';

export class ValidationUtils {
  /**
   * Validate email format
   */
  static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError(400, 'Invalid email format');
    }
  }

  /**
   * Validate password strength
   * Requirements: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
   */
  static validatePassword(password: string): void {
    if (password.length < 8) {
      throw new AppError(400, 'Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      throw new AppError(400, 'Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      throw new AppError(400, 'Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      throw new AppError(400, 'Password must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      throw new AppError(400, 'Password must contain at least one special character');
    }
  }

  /**
   * Validate vault item type
   */
  static validateVaultItemType(type: string): void {
    const validTypes = ['photo', 'video', 'letter', 'voice', 'document', 'wisdom'];
    if (!validTypes.includes(type)) {
      throw new AppError(400, `Invalid vault item type. Must be one of: ${validTypes.join(', ')}`);
    }
  }

  /**
   * Validate title for XSS prevention
   */
  static validateTitle(title: string): void {
    if (/<script|<iframe|javascript:|onerror=|onload=/i.test(title)) {
      throw new AppError(400, 'Title contains invalid characters or potential XSS content');
    }
    if (title.length > 500) {
      throw new AppError(400, 'Title must be less than 500 characters');
    }
  }

  /**
   * Validate check-in method
   */
  static validateCheckInMethod(method: string): void {
    const validMethods = ['link_click', 'email_reply', 'sms_reply', 'app_notification'];
    if (!validMethods.includes(method)) {
      throw new AppError(400, `Invalid check-in method. Must be one of: ${validMethods.join(', ')}`);
    }
  }
}
