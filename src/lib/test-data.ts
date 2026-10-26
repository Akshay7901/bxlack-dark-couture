/** Prefix on the name of every dummy record created by "Add test data", so
 * test rows can be removed together and left out of real sales figures. */
export const TEST_TAG = "TEST ";

export const isTestName = (name: string | null | undefined) => !!name?.startsWith(TEST_TAG);
