---
'@spree/admin-sdk': minor
---

Staff and API key management.

- New `client.adminUsers` accessor with `list / get / update / delete`. Listing is scoped to admin users with at least one role assignment on the current store. `delete` removes the per-store role assignment rather than deleting the global account, so the user keeps access to any other stores.
- New `client.invitations` accessor with `list / get / create / delete / resend`. Invitations carry an `email` + prefixed `role_id`; on accept, a per-store `RoleUser` is created. `resend` issues a fresh token and re-dispatches the invitation email.
- New `client.apiKeys` accessor with `list / get / create / update / delete / revoke`. Supports both `publishable` (storefront) and `secret` (server-to-server) keys. The plaintext token for secret keys is delivered exactly once on the create response — store it client-side immediately because subsequent reads expose only `token_prefix`. `revoke` marks the key revoked while preserving the row for audit.
- New `client.roles` accessor with `list / get`. Read-only — used to populate the role picker on the staff invite/edit forms.
- New types: `ApiKey`, `Invitation`, `Role`. `AdminUser` now includes a `roles` field with the role assignments scoped to the current store.
- New params types: `ApiKeyCreateParams`, `ApiKeyUpdateParams`, `InvitationCreateParams`, `AdminUserUpdateParams`.
