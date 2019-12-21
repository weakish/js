export type Usage = <T extends 0 | 1>(
  exitCode: 0 | 1,
  errorMessage: T extends 0 ? null : string
) => void;
