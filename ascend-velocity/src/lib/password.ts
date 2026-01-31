export type PasswordStrengthLevel = "muito_fraca" | "fraca" | "media" | "forte" | "muito_forte";

export type PasswordStrengthCheckId =
  | "min_length"
  | "lower"
  | "upper"
  | "number"
  | "symbol";

export interface PasswordStrengthCheck {
  id: PasswordStrengthCheckId;
  label: string;
  passed: boolean;
  required: boolean;
}

export interface PasswordStrengthResult {
  score: 0 | 1 | 2 | 3 | 4;
  level: PasswordStrengthLevel;
  label: string;
  checks: PasswordStrengthCheck[];
  minLength: number;
}

const DEFAULT_MIN_LENGTH = 8;

function toScore(passedCount: number): 0 | 1 | 2 | 3 | 4 {
  if (passedCount <= 0) return 0;
  if (passedCount === 1) return 1;
  if (passedCount === 2) return 2;
  if (passedCount === 3) return 3;
  return 4;
}

function levelFromScore(score: 0 | 1 | 2 | 3 | 4): PasswordStrengthLevel {
  if (score === 0) return "muito_fraca";
  if (score === 1) return "fraca";
  if (score === 2) return "media";
  if (score === 3) return "forte";
  return "muito_forte";
}

function labelFromLevel(level: PasswordStrengthLevel) {
  switch (level) {
    case "muito_fraca":
      return "Muito fraca";
    case "fraca":
      return "Fraca";
    case "media":
      return "Média";
    case "forte":
      return "Forte";
    case "muito_forte":
      return "Muito forte";
  }
}

export function getPasswordStrength(password: string, minLength = DEFAULT_MIN_LENGTH): PasswordStrengthResult {
  const checks: PasswordStrengthCheck[] = [
    {
      id: "min_length",
      label: `Pelo menos ${minLength} caracteres`,
      passed: password.length >= minLength,
      required: true
    },
    {
      id: "lower",
      label: "1 letra minúscula",
      passed: /[a-z]/.test(password),
      required: true
    },
    {
      id: "upper",
      label: "1 letra maiúscula",
      passed: /[A-Z]/.test(password),
      required: true
    },
    {
      id: "number",
      label: "1 número",
      passed: /\d/.test(password),
      required: true
    },
    {
      id: "symbol",
      label: "1 caractere especial (recomendado)",
      passed: /[^A-Za-z0-9]/.test(password),
      required: false
    }
  ];

  const requiredChecks = checks.filter((c) => c.required);
  const requiredPassed = requiredChecks.filter((c) => c.passed).length;
  const score = toScore(requiredPassed);
  const level = levelFromScore(score);

  return {
    score,
    level,
    label: labelFromLevel(level),
    checks,
    minLength
  };
}

export interface PasswordChangeValidationResult {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export function validatePasswordChangeForm(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  minLength?: number;
}): PasswordChangeValidationResult {
  const errors: PasswordChangeValidationResult = {};
  const minLength = input.minLength ?? DEFAULT_MIN_LENGTH;

  if (!input.currentPassword.trim()) {
    errors.currentPassword = "Informe sua senha atual.";
  }

  if (!input.newPassword) {
    errors.newPassword = "Informe a nova senha.";
  } else {
    const strength = getPasswordStrength(input.newPassword, minLength);
    const requiredOk = strength.checks.filter((c) => c.required).every((c) => c.passed);
    if (!requiredOk) {
      errors.newPassword = "A nova senha não atende aos requisitos mínimos.";
    }
  }

  if (!input.confirmPassword) {
    errors.confirmPassword = "Confirme a nova senha.";
  } else if (input.newPassword !== input.confirmPassword) {
    errors.confirmPassword = "A confirmação não corresponde à nova senha.";
  }

  return errors;
}

