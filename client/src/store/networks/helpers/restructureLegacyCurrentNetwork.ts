import { ICurrentNetwork, IRelationship } from "../networkTypes"

// Helper function to restructure to the most recent version of the ICurrentNetwork type
export function restructureLegacyCurrentNetwork(network: ICurrentNetwork) {
  const copy = { ...network }

  // Update legacy relationship formats (e.g. [reason1, reason2], "sharedReason")
  copy.people.forEach((person) => {
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

  return copy
}
