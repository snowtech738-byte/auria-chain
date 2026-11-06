// Structured errors so a calling agent can branch on `error.code` instead of
// regexing `error.message` — the message wording of a dependency is not a
// stable contract to program against.
export class AuriaError extends Error {
  constructor(code, message, options) {
    super(message, options);
    this.name = "AuriaError";
    this.code = code;
  }
}
