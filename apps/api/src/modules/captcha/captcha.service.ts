export const captchaService = {
  async verify(token: string) {
    return {
      success: token.length > 10,
      provider: "stub"
    };
  }
};
