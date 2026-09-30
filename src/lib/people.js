/** Resolves a photo's uploaded_by user id to a display label using space membership. */
export function uploaderLabel(uploadedBy, member, partner) {
  if (!uploadedBy) return null
  if (member && uploadedBy === member.user_id) return 'you'
  if (partner && uploadedBy === partner.user_id) return partner.display_name || 'your partner'
  return null
}
