# ER diagram review — v3

The original `Page-1` is preserved unchanged. The added `Clean structure` page contains all 16 entities, 98 attribute rows and 21 relationships. It uses a top-to-bottom flow, consistent table sizes, domain colors, direct connectors and attached relationship/cardinality labels. Detached attribute rows are now children of their tables. The unanchored Reward–Redemption connector has been replaced by a connector attached at both ends.

This is a diagram review, not a verification of database migrations or application rules. Schema decisions below remain unchanged in the cleaned view.

## Findings to resolve

| Priority | Finding | Suggested resolution |
| --- | --- | --- |
| High | `Redemption` contains two `created_at` rows. | Remove the duplicate, or name the second timestamp for its intended event. |
| High | `Category.name` is `UUID`, and `Category.description` is `INT`. | Confirm the intended values; both appear likely to be text fields. |
| High | `Reward.karma_cost` is `TEXT`, while redemption costs and account coins use `BIGINT`. `LedgerAccount.money` is `DOUBLE`, while other monetary values use `NUMERIC`. | Use compatible numeric types for values participating in the same calculations. Use an exact decimal or minor-unit integer representation for money. Define currency and precision consistently. |
| High | User → IndividualUser/Organization/RewardPartner and Task → OrganizationTask/PeerTask are all shown as 1:1. Read literally, these do not communicate which subtypes are optional or mutually exclusive. | Decide whether subtypes are exclusive or overlapping, express optionality explicitly, and align this with `User.role` and `Task.type`. A subtype PK/FK alone does not require every parent to have that subtype. |
| High | `OrganizationTask.organization_id` is marked FK but has no relationship to `Organization`. `LedgerTransaction.contributor_id` is ambiguous beside its relationship to `Contribution`. | Add the missing organization relationship after confirming cardinality. If the transaction FK points to `Contribution.id`, consider `contribution_id`; otherwise draw its actual target. |
| Medium | Application → Contribution says “kan fører til” (can lead to), but shows 1:1. `Contribution.application_id` is FK/UQ. | If an application may never produce a contribution, show zero-or-one contribution per application. Separately decide whether contributions can exist without an application. Uniqueness supplies an upper bound, not mandatory participation. |
| Medium | `UserProfile.contact_info` has `phone_nr / contact_email` in its type column, while both are also separate attributes. `IndividualUser.date_of_birth` is `TEXT`. | Clarify whether `contact_info` is a conceptual grouping, a structured column or redundant data. Consider `DATE` for a calendar birth date. |
| Medium | Optionality is expressed inconsistently: `email_token?` uses a name suffix; transaction FKs use `UUID?`; other columns provide no nullability. | Use a consistent nullable marker or explicit nullability column. Review optional relationships independently from their maximum cardinalities. |
| Medium | `Contribution` has `task_id`, `user_id` and `application_id`; `Application` also carries task/user FKs. | Specify how task and user values must agree with the referenced application. If duplicate applications or participations are forbidden, document the corresponding composite uniqueness rules. |
| Medium | Ledger entries, transaction currency, account totals and transaction source FKs leave important invariants unstated. | Document balanced-entry rules, currency compatibility, how stored account totals stay consistent with entries, and whether redemption/contribution source FKs are exclusive or optional. |
| Low | IndividualUser → Application is labelled “indløser”, the same verb used for reward redemption. Idempotency keys use different types, and only the transaction key is marked UQ. | Consider “ansøger” for the application relationship. Clarify the format and uniqueness scope of each idempotency key. |

## Verification

- Original page XML retained byte-for-byte within the same file.
- New page parsed successfully, with unique cell IDs and valid parent/source/target references.
- Every original attribute value, key marker and type retained, including uncertain and duplicated entries.
- All 21 original relationship names and endpoint cardinalities retained; no inferred relationship added.
- A preview generated from the new geometry was visually checked for layout and legibility. Native draw.io rendering was not used for this check.
- Backup: `v3.before-cleanup.drawio`.
