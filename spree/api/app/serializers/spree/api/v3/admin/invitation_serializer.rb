module Spree
  module Api
    module V3
      module Admin
        # Admin API serializer for {Spree::Invitation}. Used on the staff
        # settings page to list pending invitations and to surface the result
        # of `POST /admin/invitations`. Inviter and invitee are flattened to
        # email-only — the full polymorphic identities aren't useful to the UI.
        class InvitationSerializer < V3::BaseSerializer
          typelize email: :string,
                   status: :string,
                   role_id: [:string, nullable: true],
                   role_name: [:string, nullable: true],
                   inviter_email: [:string, nullable: true],
                   expires_at: [:string, nullable: true]

          attributes :email, :status,
                     created_at: :iso8601, updated_at: :iso8601, expires_at: :iso8601

          attribute :role_id do |invitation|
            invitation.role&.prefixed_id
          end

          attribute :role_name do |invitation|
            invitation.role&.name
          end

          attribute :inviter_email do |invitation|
            invitation.inviter&.email
          end
        end
      end
    end
  end
end
