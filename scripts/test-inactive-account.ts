import { accountMaySignIn } from "../src/lib/account-status";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function runUnitTests(): void {
  assert(accountMaySignIn("inactive") === false, "inactive account is rejected");
  assert(accountMaySignIn("active") === true, "active account is allowed");
  assert(accountMaySignIn(null) === true, "missing profile status is allowed");
  assert(accountMaySignIn(undefined) === true, "no profile row is allowed");

  let status: "active" | "inactive" = "active";
  status = "inactive";
  assert(accountMaySignIn(status) === false, "deactivated account is rejected");
  status = "active";
  assert(accountMaySignIn(status) === true, "reactivated account is allowed");
}

runUnitTests();
console.log("test-inactive-account: all assertions passed");
