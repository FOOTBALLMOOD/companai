/**
 * The one rule for "the authority dependency is missing" (T-16).
 *
 * Two doors guard the same thing and used to answer this question in opposite
 * directions. The tool door refused; the command gate returned, so the act ran
 * ungoverned. In a deployment that does not register the authority module an
 * assistant could not call its tools but could execute any command that declares
 * a capability, and which answer you got depended on which door you walked
 * through.
 *
 * **The distinction both doors were missing is the whole of the fix:**
 *
 * - **not registered** — the deployment chose not to gate. There is nothing to
 *   gate with, so permitting is the same answer the command gate always gave.
 *   Refusing here breaks a working deployment for a constraint it never asked
 *   for.
 * - **unreachable** — the deployment meant to gate and cannot reach the gate. A
 *   gate that cannot ask must not wave the act through, so this refuses.
 *
 * The two states are told apart by **which call failed**, never by inspecting the
 * error: a failed `container.resolve` is a missing registration, and a failed
 * `modeFor`/`decideFor` on a service that resolved is an unreachable one. An
 * error message is not a contract.
 *
 * A rule in one place, so a third door cannot invent a fourth answer.
 */

/** Which of the two missing-dependency states a door is in. */
export type AuthorityDependencyState = 'not_registered' | 'unreachable'

/** What a door does about it. */
export type AuthorityDependencyVerdict = 'permit' | 'refuse'

/**
 * The rule itself. Deliberately tiny: the value is that both doors call the same
 * function and a reader can find the reasoning in one file, not that the logic is
 * clever.
 */
export function authorityDependencyVerdict(state: AuthorityDependencyState): AuthorityDependencyVerdict {
  return state === 'not_registered' ? 'permit' : 'refuse'
}

/** The reason a refusal carries, so both doors name the same thing. */
export const AUTHORITY_UNREACHABLE_BINDING_RULE = 'enforcement-unreachable'
