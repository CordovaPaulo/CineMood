export function validatePassword(password: string): boolean {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*_()\-/.,><[\]{};:'"|]/.test(password);

    return (
        password.length >= minLength &&
        hasUppercase &&
        hasLowercase &&
        hasNumber &&
        hasSpecialChar
    );
}