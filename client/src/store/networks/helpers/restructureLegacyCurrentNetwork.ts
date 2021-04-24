import { ICurrentNetwork, IRelationship } from "../networkTypes"

// Helper function to restructure to the most recent version of the ICurrentNetwork type
export function restructureLegacyCurrentNetwork(network: ICurrentNetwork) {
  const copy = { ...network }

  // This fixes a bug with people becoming undefined in Firestore
  // by removing undefined people
  copy.people = copy.people.filter((p) => p !== undefined)
  copy.personIds = copy.people.map((p) => p.id)

  // Update legacy relationship formats (e.g. [reason1, reason2], "sharedReason")
  copy.people.forEach((person) => {
    if (!person.relationships) return
    const relationshipIds = Object.keys(person.relationships)

    relationshipIds.forEach((id) => {
      const relationship: any = person.relationships[id]

      if (!relationship.reason) {
        // No reason field? This must be a legacy relationship format.
        const isArrayFormat = relationship instanceof Array
        const isStringFormat = typeof relationship === "string"
        const isLegacyFormat = isArrayFormat || isStringFormat

        if (isLegacyFormat) {
          // Update the relationship to the most recent relationship format (see IRelationship)
          const reformattedRelationship: IRelationship = {
            reason: isArrayFormat ? relationship.join(" - ") : relationship,
          }

          person.relationships[id] = reformattedRelationship
        }
      }
    })
  })

  /* Networks created before the groups update might lack the groupIds field, causing the force graph to render incorrectly
    Restructure the network so its groupIds exist locally in global state
  */
  if (!copy.groupIds && copy.relationshipGroups) {
    copy.groupIds = Object.keys(copy.relationshipGroups)
  }

  return copy
}
